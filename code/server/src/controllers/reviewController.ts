import {
  ExistingReviewError,
  NoReviewProductError,
} from "../errors/reviewError";
import { User } from "../components/user";
import ReviewDAO from "../dao/reviewDAO";
import ProductDAO from "../dao/productDAO";
import { ProductReview } from "../components/review";
import { Utility } from "../utilities";
import { ProductNotFoundError } from "../errors/productError";

class ReviewController {
  private dao: ReviewDAO;
  private productDao: ProductDAO;

  constructor() {
    this.dao = new ReviewDAO();
    this.productDao = new ProductDAO();
  }

  /**
   * Adds a new review for a product
   * @param model The model of the product to review
   * @param user The username of the user who made the review
   * @param score The score assigned to the product, in the range [1, 5]
   * @param comment The comment made by the user
   * @returns A Promise that resolves to nothing
   */
  async addReview(
    model: string,
    user: User,
    score: number,
    comment: string
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const changes = await this.dao.addProductReview(
          model,
          user.username,
          score,
          comment,
          Utility.now(),
        );

        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Returns all reviews for a product
   * @param model The model of the product to get reviews from
   * @returns A Promise that resolves to an array of ProductReview objects
   */
  async getProductReviews(model: string): Promise<ProductReview[]> {
    //return this.dao.getReviewsByProduct(model);
    return new Promise(async (resolve, reject) => {
      try {
        // check whether the product exists. Throws ProductNotFound error if model is invalid
        const product = await this.productDao.getProductByModel(model);

        if (product instanceof ProductNotFoundError) {
          throw new ProductNotFoundError();
        }

        const productReviews = await this.dao.getReviewsByProduct(model);
        /*if (productReviews.length === 0) {
          //throw new NoReviewProductError();
          reject(new NoReviewProductError);
        }*/
        resolve(productReviews);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Deletes the review made by a user for a product
   * @param model The model of the product to delete the review from
   * @param user The user who made the review to delete
   * @returns A Promise that resolves to nothing
   */
  async deleteReview(model: string, user: User): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // check whether the product exists. Throws ProductNotFound error if model is invalid
        const product = await this.productDao.getProductByModel(model);

        if (product instanceof ProductNotFoundError) {
          throw new ProductNotFoundError();
        }
        await this.dao.deleteUserReview(model, user.username);
        resolve();
      } catch(err) {
        reject(err);
      }
    });
  }

  /**
   * Deletes all reviews for a product
   * @param model The model of the product to delete the reviews from
   * @returns A Promise that resolves to nothing
   */
  async deleteReviewsOfProduct(model: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const changes = await this.dao.deleteProductReviews(model); // throws error if model doesn't exists
        resolve();
        /*if (changes === 0) {
          reject(new NoReviewProductError());
        } else {
          resolve();
        }*/
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Deletes all reviews of all products
   * @returns A Promise that resolves to nothing
   */
  async deleteAllReviews(): Promise<void> {
    return this.dao.deleteReviews();
  }
}

export default ReviewController;
