import { test, expect, jest, describe, beforeAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"

import ReviewController from "../../src/controllers/reviewController"
import Authenticator from "../../src/routers/auth"
import { Role, User } from "../../src/components/user"
import { ProductReview } from "../../src/components/review"
import ErrorHandler from "../../src/helper"
import { Category, Product } from "../../src/components/product"
import { ExistingReviewError, NoReviewProductError } from "../../src/errors/reviewError"
const baseURL = "/ezelectronics"


jest.mock("../../src/controllers/reviewController");
jest.mock("../../src/routers/auth");

let testCustomer = new User("customer", "customer", "customer", Role.CUSTOMER, "", "");
let testProduct = new Product(100, 'test-product', Category.APPLIANCE, null, null, 10);
let testReview = new ProductReview("test-product", "customer", 4, "2024-05-31", "test-comment");


describe("Unit tests for ReviewRoutes", () => {
  describe("Route for adding a review for a given model", () => {
    test("POST reviews/:model", async () => {
      //We mock the express-validator 'param' method to return a mock object with the methods we need to validate the input parameters
      //These methods all return an empty object, because we are not testing the validation logic here (we assume it works correctly)
      jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
          isIn: () => ({ isLength: () => ({}) }),
        })),
      }))
      //We mock the ErrorHandler validateRequest method to return the next function, because we are not testing the validation logic here (we assume it works correctly)
      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next() );
      // We mock the 'isCustomer' method to return the next function, because we are not testing the Authenticator logic here (we assume it works correctly)
      jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
        req.user = testCustomer;    // Appending the test-user inside the request object
        return next();
      })
      //We mock the ReviewController addReview method to return void, because we are not testing the ReviewController logic here (we assume it works correctly)
      jest.spyOn(ReviewController.prototype, "addReview").mockResolvedValueOnce();

      /*We send a request to the route we are testing. We are in a situation where:
          - The input parameters are 'valid' (= the validation logic is mocked to be correct)
          - The review creation function is 'successful' (= the ReviewController logic is mocked to be correct)
          We expect the 'addReview' function to have been called with the input parameters and to return a 200 success code
          Since we mock the dependencies and we are testing the route in isolation, we do not need to check that the review has actually been created
      */
      const response = await request(app).post(baseURL + `/reviews/${testProduct.model}`).send(testReview);
      expect(response.status).toBe(200);
      expect(ReviewController.prototype.addReview).toHaveBeenCalled();
      // Note: the user is undefined, because it is not read from the body request
      expect(ReviewController.prototype.addReview).toHaveBeenCalledWith(testReview.model, testCustomer, testReview.score, testReview.comment);
    });

    test("Review already exists. Should return 409", async () => {
      jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
          isIn: () => ({ isLength: () => ({}) }),
        })),
      }));
      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next() );
      jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
      jest.spyOn(ReviewController.prototype, "addReview").mockRejectedValueOnce(new ExistingReviewError());

      const response = await request(app).post(baseURL + `/reviews/${testReview.model}`).send(testReview);
      expect(response.status).toBe(new ExistingReviewError().customCode);  // expected to throw error
    });

    test("Unauthorized user. Should return 401", async () => {
      jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
        return res.status(401).json({ error: "Unauthorized" });
      });

      const response = await request(app).post(baseURL + `/reviews/test-product`).send(testReview);
      expect(response.status).toBe(401);  // expected to throw error
    });
  });

  describe("Route for retrieving all reviews of a product.", () => {
    test("GET reviews/:model", async () => {
      jest.mock('express-validator', () => ({
        body: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
          isIn: () => ({ isLength: () => ({}) }),
        })),
      }))
      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
      // We mock the 'isLoggedIn' method to return the next function, because we are not testing the Authenticator logic here (we assume it works correctly)
      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
      // We mock the ReviewController getProductReviews method to return ProductReview[], because we are not testing the ReviewController logic here (we assume it works correctly)
      jest.spyOn(ReviewController.prototype, "getProductReviews").mockResolvedValueOnce([testReview]);

      const response = await request(app).get(baseURL + `/reviews/${testProduct.model}`);
      expect(response.status).toBe(200);
      expect(ReviewController.prototype.getProductReviews).toHaveBeenCalled();
      expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledWith(testReview.model);
    });

    test("No existing reviews. Should return 404", async () => {
      jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
          isIn: () => ({ isLength: () => ({}) }),
        })),
      }));
      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next() );
      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
      jest.spyOn(ReviewController.prototype, "getProductReviews").mockRejectedValueOnce(new NoReviewProductError());

      const response = await request(app).get(baseURL + `/reviews/test-product`);
      expect(response.status).toBe(new NoReviewProductError().customCode);
    });

    test("Unauthorized user. Should return 401", async () => {
      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        return res.status(401).json({ error: "Unauthorized" });
      });

      const response = await request(app).get(baseURL + `/reviews/${testProduct.model}`);
      expect(response.status).toBe(401);  // expected to throw error
    });
  });

  describe("Route for deleting the review made by a user for one product", () => {
    test("DELETE reviews/:model", async () => {
      jest.mock('express-validator', () => ({
        body: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
          isIn: () => ({ isLength: () => ({}) }),
        })),
      }))
      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
      // We mock the 'isCustomer' method to return the next function, because we are not testing the Authenticator logic here (we assume it works correctly)
      jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
        req.user = testCustomer;
        next();
      });
      // We mock the ReviewController deleteReview method to return void, because we are not testing the ReviewController logic here (we assume it works correctly)
      jest.spyOn(ReviewController.prototype, "deleteReview").mockResolvedValueOnce();

      const response = await request(app).delete(baseURL + `/reviews/${testProduct.model}`);
      expect(response.status).toBe(200);
      expect(ReviewController.prototype.deleteReview).toHaveBeenCalled();
      expect(ReviewController.prototype.deleteReview).toHaveBeenCalledWith(testReview.model, testCustomer);  // model and userObj, which is undefined in this test
    });

    test("No existing reviews. Should return 404", async () => {
      jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
          isIn: () => ({ isLength: () => ({}) }),
        })),
      }));
      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next() );
      jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
      jest.spyOn(ReviewController.prototype, "deleteReview").mockRejectedValueOnce(new NoReviewProductError());

      const response = await request(app).delete(baseURL + `/reviews/test-product`);
      expect(response.status).toBe(new NoReviewProductError().customCode);
    });

    test("Unauthorized user. Should return 401", async () => {
      jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
        return res.status(401).json({ error: "Unauthorized" });
      });

      const response = await request(app).delete(baseURL + `/reviews/${testProduct.model}`);
      expect(response.status).toBe(401);  // expected to throw error
    });
  });

  describe("Route for deleting all reviews of a product", () => {
    test("DELETE reviews/:model/all", async () => {
      jest.mock('express-validator', () => ({
        body: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
          isIn: () => ({ isLength: () => ({}) }),
        })),
      }))
      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
      // We mock the 'isAdminOrManager' method to return the next function, because we are not testing the Authenticator logic here (we assume it works correctly)
      jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());
      // We mock the ReviewController deleteReviewsOfProduct method to return void, because we are not testing the ReviewController logic here (we assume it works correctly)
      jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockResolvedValueOnce();

      const response = await request(app).delete(baseURL + `/reviews/${testProduct.model}/all`);
      expect(response.status).toBe(200);
      expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalled();
      expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith(testReview.model);  // model and userObj, which is undefined in this test
    });

    test("No existing reviews. Should return 404", async () => {
      jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
          isIn: () => ({ isLength: () => ({}) }),
        })),
      }));
      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next() );
      jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());
      jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockRejectedValueOnce(new NoReviewProductError());

      const response = await request(app).delete(baseURL + `/reviews/test-product/all`);
      expect(response.status).toBe(new NoReviewProductError().customCode);
    });

    test("Unauthorized user. Should return 401", async () => {
      jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
        return res.status(401).json({ error: "Unauthorized" });
      });

      const response = await request(app).delete(baseURL + `/reviews/${testProduct.model}/all`);
      expect(response.status).toBe(401);  // expected to throw error
    });
  });

  describe("Route for deleting all reviews of all products", () => {
    test("DELETE reviews", async () => {
      jest.mock('express-validator', () => ({
        body: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
          isIn: () => ({ isLength: () => ({}) }),
        })),
      }));

      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
      jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());
      jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockResolvedValueOnce();

      const response = await request(app).delete(baseURL + `/reviews`);
      expect(response.status).toBe(200);
      expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalled();
      expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalledWith();
    });

    test("No existing reviews. Should return 404", async () => {
      jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
          isIn: () => ({ isLength: () => ({}) }),
        })),
      }));
      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next() );
      jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());
      jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockRejectedValueOnce(new NoReviewProductError());

      const response = await request(app).delete(baseURL + `/reviews`);
      expect(response.status).toBe(new NoReviewProductError().customCode);
    });

    test("Unauthorized user. Should return 401", async () => {
      jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
        return res.status(401).json({ error: "Unauthorized" });
      });

      const response = await request(app).delete(baseURL + `/reviews`);
      expect(response.status).toBe(401);  // expected to throw error
    });
  });
});