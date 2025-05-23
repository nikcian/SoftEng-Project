import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import { cleanup } from "../src/db/cleanup"
import { Category } from "../src/components/product"
import ProductDAO from "../src/dao/productDAO"
import CartDAO from "../src/dao/cartDAO"
import { ExistingReviewError, NoReviewProductError } from "../src/errors/reviewError"
import { ProductNotInCartError } from "../src/errors/cartError"
import { ProductNotFoundError } from "../src/errors/productError"

const routePath = "/ezelectronics" //Base route path for the API

//Default user information. We use them to create users and evaluate the returned values
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" };
const manager = { username: "manager", name: "manager", surname: "manager", password: "manager", role: "Manager" };
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" };
// Review data (product will have 1 review, while product2 won't have any)
const product = {model: 'test-model', category: "Appliance", quantity: 3, details: 'some details', sellingPrice: 50, arrivalDate: '2024-06-06'};
const product2 = {model: 'test-model-2', category: "Smartphone", quantity: 3, details: 'other details', sellingPrice: 20, arrivalDate: '2024-06-06'};
const review = {model: product.model, user: customer.username, score: 4, comment: 'test comment', date: '2024-06-06'};
//Cookies for the users. We use them to keep users logged in. Creating them once and saving them in a variables outside of the tests will make cookies reusable
let customerCookie: string;
let adminCookie: string;
let managerCookie: string;

//Helper function that creates a new user in the database.
//Can be used to create a user before the tests or in the tests
//Is an implicit test because it checks if the return code is successful
const postUser = async (userInfo: any) => {
  await request(app)
    .post(`${routePath}/users`)
    .send(userInfo)
    .expect(200);
}

//Helper function that logs in a user and returns the cookie
//Can be used to log in a user before the tests or in the tests
const login = async (userInfo: any) => {
  return new Promise<string>((resolve, reject) => {
    request(app)
      .post(`${routePath}/sessions`)
      .send(userInfo)
      .expect(200)
      .end((err, res) => {
        if (err) {
          reject(err)
        }
        resolve(res.header["set-cookie"][0])
      })
  })
}

/*const logout = async () => {
  return new Promise((resolve,reject) => {
    request(app)
    .delete(`${routePath}/sessions/current`)
    .expect(200)
    .end((err, res) => {
      if(err) reject(err);
      else resolve(undefined);
    });
  });
}*/

const addProduct = (productData: any) => {
  return new Promise((resolve, reject) => {
    request(app)
      .post(`${routePath}/products`)
      .set('Cookie', managerCookie)
      .send(productData)
      // x-www-form-urlencoded upload
      /*.send(new URLSearchParams(Object.entries({model: productData.model, 
        category: productData.category, 
        quantity: productData.quantity,
        details: productData.details,
        sellingPrice: productData.sellingPrice,
        arrivalDate: productData.arrivalDate
      })).toString())*/
      .then(() => resolve(undefined))
      .catch((err) => reject(err))
    //expect(response.status).toBe(200);
  });
};

// Add product to cart, then checkout
const purchaseProduct = (username: String, productModel: string) => {
  return new Promise((resolve, reject) => {
    request(app)
      .post(`${routePath}/carts`)
      .send({model: productModel})
      .set('Cookie', customerCookie)
      .then(() => {
        request(app)
        .patch(`${routePath}/carts`)
        .set('Cookie', customerCookie)
        .then(() => resolve(undefined))
      }).catch((err) => reject(err));
  });
};

// Add review for a purchased product
const addReview = (review: any, userCookie: any) => {
  return new Promise((resolve, reject) => {
    request(app)
      .post(`${routePath}/reviews/${review.model}`)
      .set("Cookie", userCookie).send(review).expect(200)
      .then(() => {
        resolve(undefined)
      }).catch((err) => reject(err));
  });
};

//Before executing tests, we remove everything from our test database, create an Admin user and log in as Admin, saving the cookie in the corresponding variable
beforeAll(async () => {
  cleanup()

  // admin login
  await postUser(admin);
  adminCookie = await login(admin);
  // customer login
  await postUser(customer);
  customerCookie = await login(customer);
  // manager login
  await postUser(manager);
  managerCookie = await login(manager);
  
  await addProduct(product);            // Manager inserts a new product
  await addProduct(product2);            // Manager inserts a new product
  await purchaseProduct(customer.username, product.model); // Customer purchase the first product
})

//After executing tests, we remove everything from our test database
afterAll(() => {
  cleanup()
})

describe("Review routes integration tests", () => {
  describe("Route for adding a new review for a product - POST /:model", () => {
    test("Create a new review - Should return 200 success", async () => {
      // Testing code 200 (success) is done inside the following function
      await addReview(review, customerCookie);
    });
    test("Manager attemps to write a review - Should return 401 unauthorized", async () => {
      const response = await request(app)
      .post(`${routePath}/reviews/${review.model}`)
      .set("Cookie", managerCookie).send(review);
      expect(response.status).toBe(401);
    });
    // We have used reviewID as primary key, so it is possible, without any other checks, to write multiple reviews for the same product by the same user
    test("Customer has already reviewed the product - Should return ExistingReviewError", async () => {
      const err = new ExistingReviewError();
      const response = await request(app)
      .post(`${routePath}/reviews/${review.model}`)
      .set("Cookie", customerCookie).send(review);

      expect(response.status).toBe(err.customCode);
      expect(JSON.parse(response.text).error).toEqual(err.customMessage);
    });
  });

  describe("Route for getting all reviews for a product - GET /:model", () => {
    test("Get all product reviews - Should return 200 success", async () => {
      const response = await request(app)
      .get(`${routePath}/reviews/${review.model}`)
      .set("Cookie", customerCookie)
      .expect(200)

      expect(response.body).toHaveLength(1);
      let rev = response.body[0];
      expect(rev).toBeDefined();
      expect(rev.model).toBe(review.model);
      expect(rev.user).toBe(review.user);
    });

    test("No available reviews - Should return 200 success, with empty response", async () => {
      const response = await request(app)
      .get(`${routePath}/reviews/${product2.model}`)
      .set("Cookie", customerCookie)
      .expect(200)

      expect(response.body).toHaveLength(0);
    });

    test("Invalid model - Should return ProductNotFoundError", async () => {
      const err = new ProductNotFoundError();
      const response = await request(app)
      .get(`${routePath}/reviews/invalid-model`)
      .set("Cookie", customerCookie)
      
      expect(response.status).toEqual(err.customCode);
      expect(JSON.parse(response.text).error).toEqual(err.customMessage);
    });

    test("User not logged in - Should return 401", async () => {
      const response = await request(app)
      .get(`${routePath}/reviews/${product.model}`)
      .expect(401)
    });
  });

  describe("Route for deleting a review by model - DELETE /:model", () => {
    test("Delete customer review by model - Should return 200 success", async () => {
      const response = await request(app)
      .delete(`${routePath}/reviews/${review.model}`)
      .set("Cookie", customerCookie)
      .expect(200)
    });
    test("Product does not exists - Should return 404 ProductNotFoundError", async () => {
      const err = new ProductNotFoundError();
      const response = await request(app)
      .delete(`${routePath}/reviews/InvalidModel`)
      .set("Cookie", customerCookie)
      .expect(err.customCode)
      
      expect(JSON.parse(response.text).error).toEqual(err.customMessage);
    });
    test("Review does not exists - Should return 404 NoReviewProductError", async () => {
      const err = new NoReviewProductError();
      const response = await request(app)
      .delete(`${routePath}/reviews/${review.model}`)
      .set("Cookie", customerCookie)
      .expect(err.customCode)
      
      expect(JSON.parse(response.text).error).toEqual(err.customMessage);
    });
    test("User is not a customer - Should return 401", async () => {
      const response = await request(app)
      .delete(`${routePath}/reviews/${review.model}`)
      .expect(401)
    });
  });

  describe("Route for deleting all reviews of a product - DELETE /:model/all", () => {
    test("Delete all reviews for a model - Should return 200 success", async () => {
      // re-add previously deleted review
      await addReview(review, customerCookie);
      const response = await request(app)
      .delete(`${routePath}/reviews/${review.model}/all`)
      .set("Cookie", managerCookie)
      .expect(200)
    });
    test("Invalid model - Should return NoReviewProductError", async () => {
      const err = new ProductNotFoundError();
      const response = await request(app)
      .delete(`${routePath}/reviews/InvalidModel/all`)
      .set("Cookie", managerCookie)
      .expect(err.customCode)
      
      expect(JSON.parse(response.text).error).toEqual(err.customMessage);
    });
    test("User is not a manager or admin - Should return 401", async () => {
      const response = await request(app)
      .delete(`${routePath}/reviews/${review.model}/all`)
      .expect(401)
    });
  });

  describe("Route for deleting all reviews of all products - DELETE /", () => {
    test("Delete all reviews for a model - Should return 200 success", async () => {
      // re-add previously deleted review
      await addReview(review, customerCookie);
      const response = await request(app)
      .delete(`${routePath}/reviews`)
      .set("Cookie", managerCookie)
      .expect(200)
    });
    test("User is not a manager or admin - Should return 401", async () => {
      const response = await request(app)
      .delete(`${routePath}/reviews`)
      .expect(401)
    });
  });
});