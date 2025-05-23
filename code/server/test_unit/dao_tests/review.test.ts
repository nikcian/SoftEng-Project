import { describe, test, jest, expect, beforeEach, beforeAll, afterAll, afterEach } from '@jest/globals'
import ReviewDAO from '../../src/dao/reviewDAO'
import { Database } from 'sqlite3';
import db from '../../src/db/db'
import { ProductReview } from '../../src/components/review';
import { ProductNotInCartError } from '../../src/errors/cartError';
import { ExistingReviewError, NoReviewProductError } from '../../src/errors/reviewError';
import { ProductNotFoundError } from '../../src/errors/productError';

jest.mock("../../src/db/db.ts");

let reviewDAO: ReviewDAO;
// For testing purpose, user is always undefined (cannot mock login module)
let testReviewJson = {model: "test-product", score: 4, date: "2024-05-31", comment: "test-comment", user: "test-username"};

describe("Unit tests for ReviewDAO", () => {
  beforeEach(() => {
    reviewDAO = new ReviewDAO();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe("getReviewsByProduct(model)", () => {
    test("Success - Should return a ProductReview[] type", async () => {
      const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null, [{
          model: testReviewJson.model,
          score: testReviewJson.score,
          date: testReviewJson.date,
          comment: testReviewJson.comment,
          username: testReviewJson.user
        }]);   // function(err, rows) sqlite
        return {} as Database;
      });
  
      const result = await reviewDAO.getReviewsByProduct(testReviewJson.model);
      expect(result).toEqual([testReviewJson]);
      expect(mockDBAll).toHaveBeenCalled();
    });

    test("Generic fail - Should return the thrown error", async () => {
      const err = new Error("generic error");
      const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(err);   // function(err, rows) sqlite
        return {} as Database;
      });
  
      const result = reviewDAO.getReviewsByProduct(testReviewJson.model);
      await expect(result).rejects.toEqual(err);  // await promise to return reject
      expect(mockDBAll).toHaveBeenCalled();
    });
  });

  describe("addProductReview(...)", () => {
    test("Success - Should return 1 (this.changes)", async () => {
      // Assuming that the product has been purchased by the user
      const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, [testReviewJson]);
        return {} as Database;
      });
      // Assuming that the review has successfully been inserted
      const mockDBRun = jest.spyOn(db, "run").mockImplementation(function(sql, params, callback) {
        callback.call({changes: 1}, null);  // (this.changes, err) sqlite
        return {} as Database;
      });
      // Assuming that the customer has not reviewed the product yet
      const mock_getReviewsByProduct = jest.spyOn(reviewDAO, "getReviewsByProduct").mockResolvedValueOnce([]);

      const result = await reviewDAO.addProductReview(
        testReviewJson.model, 'test-username', testReviewJson.score, testReviewJson.comment, testReviewJson.date
      );
      expect(result).toBe(1);
      expect(mockDBGet).toHaveBeenCalled();
      expect(mockDBRun).toHaveBeenCalled();
      expect(mock_getReviewsByProduct).toHaveBeenCalled();
    });

    test("Generic fail - Should return the thrown error", async () => {
      const err = new Error("generic error");
      // Simulate generic fail
      const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(err, [testReviewJson]);
        return {} as Database;
      });
      
      const result = reviewDAO.addProductReview(
        testReviewJson.model, 'test-username', testReviewJson.score, testReviewJson.comment, testReviewJson.date
      );
      await expect(result).rejects.toEqual(err);
      expect(mockDBGet).toHaveBeenCalled();
    });

    test("Product not found in purchased cart - Should return error", async () => {
      // Simulate generic fail
      const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, undefined);
        return {} as Database;
      });

      const result = reviewDAO.addProductReview(
        testReviewJson.model, 'test-username', testReviewJson.score, testReviewJson.comment, testReviewJson.date
      );
      await expect(result).rejects.toEqual(new ProductNotInCartError());
      expect(mockDBGet).toHaveBeenCalled();
    });

    test("Cannot add review to the product - Should return error", async () => {
      const err = new Error("generic error");
      // Assuming that the product has been purchased by the user
      const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, [testReviewJson]);
        return {} as Database;
      });
      // Assuming insertion fail
      const mockDBRun = jest.spyOn(db, "run").mockImplementation(function(sql, params, callback) {
        callback.call({changes: 1}, err);  // (this.changes, err) sqlite
        return {} as Database;
      });
      // Assuming that the customer has not reviewed the product yet
      const mock_getReviewsByProduct = jest.spyOn(reviewDAO, "getReviewsByProduct").mockResolvedValueOnce([]);

      const result = reviewDAO.addProductReview(
        testReviewJson.model, 'test-username', testReviewJson.score, testReviewJson.comment, testReviewJson.date
      );
      await expect(result).rejects.toThrow(err);
      expect(mockDBGet).toHaveBeenCalled();
      expect(mockDBRun).toHaveBeenCalled();
      expect(mock_getReviewsByProduct).toHaveBeenCalled();
    });

    test("Customer has already reviewed the product - Should return ExistingReviewError", async () => {
      const err = new ExistingReviewError();
      // Assuming that the product has been purchased by the user
      const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, [testReviewJson]);
        return {} as Database;
      });
      // Assuming that the customer has already reviewed the product
      const mock_getReviewsByProduct = jest.spyOn(reviewDAO, "getReviewsByProduct").mockResolvedValueOnce([testReviewJson]);

      const result = reviewDAO.addProductReview(
        testReviewJson.model, 'test-username', testReviewJson.score, testReviewJson.comment, testReviewJson.date
      );
      await expect(result).rejects.toThrow(err);
      expect(mockDBGet).toHaveBeenCalled();
      expect(mock_getReviewsByProduct).toHaveBeenCalled();
    });
  });

  describe("deleteUserReview(model, username)", () => {
    test("Success - Should return nothing (undefined)", async () => {
      // Assuming that the product has been purchased by the user
      const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, [testReviewJson]);
        return {} as Database;
      });
      // Assuming that the review has successfully been deleted
      const mockDBRun = jest.spyOn(db, "run").mockImplementation(function(sql, params, callback) {
        callback.call({changes: 1}, null);  // (this.changes, err) sqlite
        return {} as Database;
      });
      
      const result = await reviewDAO.deleteUserReview(testReviewJson.model, 'test-username');
      //expect(result).toBe(1);
      expect(result).toBeUndefined();
      expect(mockDBGet).toHaveBeenCalled();
      expect(mockDBRun).toHaveBeenCalled();
    });

    test("Generic fail - Should return the thrown error", async () => {
      const err = new Error("generic error");
      const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(err, undefined);
        return {} as Database;
      });
      
      const result = reviewDAO.deleteUserReview(testReviewJson.model, 'test-username');
      await expect(result).rejects.toThrow(err);
      expect(mockDBGet).toHaveBeenCalled();
    });

    test("Review not found - Should return nothing (undefined)", async () => {
      const err = new NoReviewProductError();
      const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, undefined);
        return {} as Database;
      });
      
      const result = reviewDAO.deleteUserReview(testReviewJson.model, 'test-username');
      await expect(result).rejects.toThrow(err);
      expect(mockDBGet).toHaveBeenCalled();
    });

    test("Cannot delete the review - Should return thrown error", async () => {
      const err = new Error("generic error");
      // Assuming that the product has been purchased by the user
      const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, [testReviewJson]);
        return {} as Database;
      });
      // Assuming deletion fail
      const mockDBRun = jest.spyOn(db, "run").mockImplementation(function(sql, params, callback) {
        callback.call({changes: 1}, err);  // (this.changes, err) sqlite
        return {} as Database;
      });
      
      const result = reviewDAO.deleteUserReview(testReviewJson.model, 'test-username');
      await expect(result).rejects.toThrow(err);
      expect(mockDBGet).toHaveBeenCalled();
      expect(mockDBRun).toHaveBeenCalled();
    });
  });

  describe("deleteProductReviews(model)", () => {
    test("Success - Should return 1 (this.changes)", async () => {
      // Assuming that the user is manager or admin
      const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, [testReviewJson]);
        return {} as Database;
      });
      // Assuming that all reviews have successfully been deleted
      const mockDBRun = jest.spyOn(db, "run").mockImplementation(function(sql, params, callback) {
        callback.call({changes: 1}, null);  // (this.changes, err) sqlite
        return {} as Database;
      });
      
      const result = await reviewDAO.deleteProductReviews(testReviewJson.model);
      expect(result).toBe(1);
      expect(mockDBGet).toHaveBeenCalled();
      expect(mockDBRun).toHaveBeenCalled();
    });

    test("Generic fail - Should return the thrown error", async () => {
      const err = new Error("generic error");
      const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(err, [testReviewJson]);
        return {} as Database;
      });
      
      const result = reviewDAO.deleteProductReviews(testReviewJson.model);
      await expect(result).rejects.toThrow(err);
      expect(mockDBGet).toHaveBeenCalled();
    });

    test("Product not found - Should return error", async () => {
      const err = new ProductNotFoundError();
      const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback.call(null, undefined);
        return {} as Database;
      });
      
      const result = reviewDAO.deleteProductReviews(testReviewJson.model);
      await expect(result).rejects.toStrictEqual(err)
      expect(mockDBGet).toHaveBeenCalled();
    });

    test("Cannot delete reviews - Should return thrown error", async () => {
      const err = new Error("generic error");
      // Assuming that the product has been purchased by the user
      const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, [testReviewJson]);
        return {} as Database;
      });
      // Assuming deletion fail
      const mockDBRun = jest.spyOn(db, "run").mockImplementation(function(sql, params, callback) {
        callback.call({changes: 1}, err);  // (this.changes, err) sqlite
        return {} as Database;
      });
      
      const result = reviewDAO.deleteProductReviews(testReviewJson.model);
      await expect(result).rejects.toThrow(err);
      expect(mockDBGet).toHaveBeenCalled();
      expect(mockDBRun).toHaveBeenCalled();
    });
  });

  describe("deleteReviews()", () => {
    test("Success - Should return nothing (undefined)", async () => {
      // Assuming that the user is manager or admin
      // Assuming that all reviews have successfully been deleted
      const mockDBRun = jest.spyOn(db, "run").mockImplementation(function(sql, params, callback) {
        callback.call({changes: 1}, null);  // (this.changes, err) sqlite
        return {} as Database;
      });
      
      const result = await reviewDAO.deleteReviews();
      expect(result).toBeUndefined();
      expect(mockDBRun).toHaveBeenCalled();
    });

    test("Generic fail - Should return the thrown error", async () => {
      const err = new Error("generic error");
      const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(err, [testReviewJson]);
        return {} as Database;
      });
      
      const result = reviewDAO.deleteReviews();
      await expect(result).rejects.toThrow(err);
      expect(mockDBRun).toHaveBeenCalled();
    });
  });
});