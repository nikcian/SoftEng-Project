import { test, expect, jest, describe, beforeAll } from "@jest/globals";
import request from "supertest";
import { app } from "../../index";

import CartController from "../../src/controllers/cartController";
import Authenticator from "../../src/routers/auth";
import { Role, User } from "../../src/components/user";
import { Cart, ProductInCart } from "../../src/components/cart";
import ErrorHandler from "../../src/helper";
import { Category, Product } from "../../src/components/product";
import {
  EmptyProductStockError,
  LowProductStockError,
  ProductNotFoundError,
} from "../../src/errors/productError";
import { CartNotFoundError, EmptyCartError, ProductNotInCartError } from "../../src/errors/cartError";

const baseURL = "/ezelectronics/carts";

jest.mock("../../src/controllers/cartController");
jest.mock("../../src/controllers/userController");
jest.mock("../../src/routers/auth");

let testCustomer = new User("customer", "customer", "customer", Role.CUSTOMER, "", "");
let testProduct = new Product(100, "test-product", Category.APPLIANCE, null, null, 10);
let testCart = new Cart(testCustomer.username, false, "", 200, [
  new ProductInCart(testProduct.model, 2, Category.APPLIANCE, 100),
]);
let testPaidCart = new Cart(testCustomer.username, true, "2024-01-01", 200, [
  new ProductInCart(testProduct.model, 2, Category.APPLIANCE, 100),
]);
let testCartArray = [testPaidCart, testPaidCart];

describe("Route for adding a product to a given cart", () => {
  test("POST ezelectronics/carts", async () => {
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => ({ isLength: () => ({}) }),
        isIn: () => ({ isLength: () => ({}) }),
      })),
    }));

    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
    jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
    jest.spyOn(CartController.prototype, "addToCart").mockResolvedValueOnce(true);

    const testBody = { user: testCustomer, model: testProduct.model };
    const response = await request(app).post(baseURL).send(testBody);
    expect(response.status).toBe(200);
    expect(CartController.prototype.addToCart).toHaveBeenCalled();
    expect(CartController.prototype.addToCart).toHaveBeenCalledWith(undefined, testBody.model);
  });

  test("Product does not exist. Should return 404", async () => {
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => ({ isLength: () => ({}) }),
        isIn: () => ({ isLength: () => ({}) }),
      })),
    }));

    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
    jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
    jest.spyOn(CartController.prototype, "addToCart").mockRejectedValueOnce(new ProductNotFoundError());

    const testBody = { user: testCustomer, model: testProduct.model };
    const response = await request(app).post(baseURL).send(testBody);
    expect(response.status).toBe(404);
    expect(CartController.prototype.addToCart).toHaveBeenCalled();
    expect(CartController.prototype.addToCart).toHaveBeenCalledWith(undefined, testBody.model);
  });

  test("Product is not available. Should return 409", async () => {
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => ({ isLength: () => ({}) }),
        isIn: () => ({ isLength: () => ({}) }),
      })),
    }));

    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
    jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
    jest.spyOn(CartController.prototype, "addToCart").mockRejectedValueOnce(new EmptyProductStockError());

    const testBody = { user: testCustomer, model: testProduct.model };
    const response = await request(app).post(baseURL).send(testBody);
    expect(response.status).toBe(409);
    expect(CartController.prototype.addToCart).toHaveBeenCalled();
    expect(CartController.prototype.addToCart).toHaveBeenCalledWith(undefined, testBody.model);
  });
});

describe("Route for retrieving all carts, current cart and carts history", () => {
  test("GET ezelectronics/carts", async () => {
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => ({ isLength: () => ({}) }),
        isIn: () => ({ isLength: () => ({}) }),
      })),
    }));

    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
    jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
    jest.spyOn(CartController.prototype, "getCart").mockResolvedValue(testCart);

    const response = await request(app).get(baseURL);
    expect(response.status).toBe(200);
    expect(CartController.prototype.getCart).toHaveBeenCalled();
  });

  test("GET ezelectronics/carts/history", async () => {
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => ({ isLength: () => ({}) }),
        isIn: () => ({ isLength: () => ({}) }),
      })),
    }));

    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
    jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
    jest.spyOn(CartController.prototype, "getCustomerCarts").mockResolvedValue(testCartArray);

    const response = await request(app).get(baseURL + "/history");
    expect(response.status).toBe(200);
    expect(CartController.prototype.getCustomerCarts).toHaveBeenCalled();
  });

  test("GET ezelectronics/carts/all", async () => {
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => ({ isLength: () => ({}) }),
        isIn: () => ({ isLength: () => ({}) }),
      })),
    }));

    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
    jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());
    jest.spyOn(CartController.prototype, "getAllCarts").mockResolvedValue(testCartArray);

    const response = await request(app).get(baseURL + "/all");
    expect(response.status).toBe(200);
    expect(CartController.prototype.getAllCarts).toHaveBeenCalled();
  });
});

describe("Route for the cart checkout", () => {
  test("PATCH ezelectronics/carts", async () => {
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => ({ isLength: () => ({}) }),
        isIn: () => ({ isLength: () => ({}) }),
      })),
    }));

    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
    jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
    jest.spyOn(CartController.prototype, "checkoutCart").mockResolvedValue(true);

    const response = await request(app).patch(baseURL);
    expect(response.status).toBe(200);
    expect(CartController.prototype.checkoutCart).toHaveBeenCalled();
  });

  test("No information about unpaid cart. Should return 404", async () => {
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => ({ isLength: () => ({}) }),
        isIn: () => ({ isLength: () => ({}) }),
      })),
    }));

    const error = new CartNotFoundError();

    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
    jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
    jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(error);

    const response = await request(app).patch(baseURL);
    expect(response.status).toBe(error.customCode);
    expect(CartController.prototype.checkoutCart).toHaveBeenCalled();
  });

  test("The unpaid cart contains no product. Should return 400", async () => {
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => ({ isLength: () => ({}) }),
        isIn: () => ({ isLength: () => ({}) }),
      })),
    }));

    const error = new EmptyCartError();

    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
    jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
    jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(error);

    const response = await request(app).patch(baseURL);
    expect(response.status).toBe(error.customCode);
    expect(CartController.prototype.checkoutCart).toHaveBeenCalled();
  });

  test("The unpaid cart contains at least one product out of stock. Should return 409", async () => {
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => ({ isLength: () => ({}) }),
        isIn: () => ({ isLength: () => ({}) }),
      })),
    }));

    const error = new EmptyProductStockError();

    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
    jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
    jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(error);

    const response = await request(app).patch(baseURL);
    expect(response.status).toBe(error.customCode);
    expect(CartController.prototype.checkoutCart).toHaveBeenCalled();
  });

  test("The unpaid cart contains at least one product with lower quantity than request. Should return 409", async () => {
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => ({ isLength: () => ({}) }),
        isIn: () => ({ isLength: () => ({}) }),
      })),
    }));

    const error = new LowProductStockError();

    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
    jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
    jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(error);

    const response = await request(app).patch(baseURL);
    expect(response.status).toBe(error.customCode);
    expect(CartController.prototype.checkoutCart).toHaveBeenCalled();
  });
});

describe("Route to delete all carts, delete a cart and delete a product from the current cart", () => {
  test("DELETE ezelectronics/carts", async () => {
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => ({ isLength: () => ({}) }),
        isIn: () => ({ isLength: () => ({}) }),
      })),
    }));

    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
    jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());
    jest.spyOn(CartController.prototype, "deleteAllCarts").mockResolvedValue(true);

    const response = await request(app).delete(baseURL);
    expect(response.status).toBe(200);
    expect(CartController.prototype.deleteAllCarts).toHaveBeenCalled();
  });

  test("DELETE ezelectronics/carts/current", async () => {
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => ({ isLength: () => ({}) }),
        isIn: () => ({ isLength: () => ({}) }),
      })),
    }));

    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
    jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
    jest.spyOn(CartController.prototype, "clearCart").mockResolvedValue(true);

    const response = await request(app).delete(baseURL + "/current");
    expect(response.status).toBe(200);
    expect(CartController.prototype.clearCart).toHaveBeenCalled();
  });

  test("No information about the current cart. Should return 404", async () => {
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => ({ isLength: () => ({}) }),
        isIn: () => ({ isLength: () => ({}) }),
      })),
    }));

    const error = new CartNotFoundError();

    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
    jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
    jest.spyOn(CartController.prototype, "clearCart").mockRejectedValueOnce(error);

    const response = await request(app).delete(baseURL + "/current");
    expect(response.status).toBe(error.customCode);
    expect(CartController.prototype.clearCart).toHaveBeenCalled();
  });

  test("DELETE ezelectronics/carts/products/:model", async () => {
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => ({ isLength: () => ({}) }),
        isIn: () => ({ isLength: () => ({}) }),
      })),
    }));

    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
    jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
    jest.spyOn(CartController.prototype, "removeProductFromCart").mockResolvedValue(true);

    const testBody = { user: testCustomer.username, model: testProduct.model };
    const response = await request(app).delete(baseURL + "/products/" + testBody.model);
    expect(response.status).toBe(200);
    expect(CartController.prototype.removeProductFromCart).toHaveBeenCalled();
  });

  test("Product not present in cart. Should return 404", async () => {
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => ({ isLength: () => ({}) }),
        isIn: () => ({ isLength: () => ({}) }),
      })),
    }));

    const error = new ProductNotInCartError();

    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
    jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
    jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(error);

    const testBody = { user: testCustomer.username, model: testProduct.model };
    const response = await request(app).delete(baseURL + "/products/" + testBody.model);
    expect(response.status).toBe(error.customCode);
    expect(CartController.prototype.removeProductFromCart).toHaveBeenCalled();
  });

  test("No information about the current cart. Should return 404. Should return 404", async () => {
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => ({ isLength: () => ({}) }),
        isIn: () => ({ isLength: () => ({}) }),
      })),
    }));

    const error = new CartNotFoundError();

    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
    jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
    jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(error);

    const testBody = { user: testCustomer.username, model: testProduct.model };
    const response = await request(app).delete(baseURL + "/products/" + testBody.model);
    expect(response.status).toBe(error.customCode);
    expect(CartController.prototype.removeProductFromCart).toHaveBeenCalled();
  });

  test("The product provided does not exist. Should return 404. Should return 404", async () => {
    jest.mock("express-validator", () => ({
      param: jest.fn().mockImplementation(() => ({
        isString: () => ({ isLength: () => ({}) }),
        isIn: () => ({ isLength: () => ({}) }),
      })),
    }));

    const error = new ProductNotFoundError();

    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
    jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
    jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(error);

    const testBody = { user: testCustomer.username, model: testProduct.model };
    const response = await request(app).delete(baseURL + "/products/" + testBody.model);
    expect(response.status).toBe(error.customCode);
    expect(CartController.prototype.removeProductFromCart).toHaveBeenCalled();
  });
});
