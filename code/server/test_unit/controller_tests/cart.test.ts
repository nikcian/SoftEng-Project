import { test, expect, jest, describe, beforeAll } from "@jest/globals";

import CartController from "../../src/controllers/cartController";
import Authenticator from "../../src/routers/auth";
import { Role, User } from "../../src/components/user";
import { Cart, ProductInCart } from "../../src/components/cart";
import { Category, Product } from "../../src/components/product";
import {
  EmptyProductStockError,
  LowProductStockError,
  ProductNotFoundError,
} from "../../src/errors/productError";
import {
  CartNotFoundError,
  EmptyCartError,
  ProductNotInCartError,
  ProductInCartError,
} from "../../src/errors/cartError";
import CartDAO from "../../src/dao/cartDAO";
import ProductDAO from "../../src/dao/productDAO";
import ProductController from "../../src/controllers/productController";

let testCustomer = new User("customer-username", "customer-name", "customer-surname", Role.CUSTOMER, "", "");
let testProduct = new Product(100, "test-product", Category.APPLIANCE, null, null, 10);
let testCart = new Cart(testCustomer.username, false, "", 200, [
  new ProductInCart(testProduct.model, 2, Category.APPLIANCE, 100),
]);
let testCartError = new Cart(testCustomer.username, false, "", 200, [
  new ProductInCart(testProduct.model, 20, Category.APPLIANCE, 100),
]);
let testCartEmpty = new Cart(testCustomer.username, false, "", 0, []);
let testPaidCart = new Cart(testCustomer.username, true, "2024-01-01", 200, [
  new ProductInCart(testProduct.model, 10, Category.APPLIANCE, 100),
]);
let testCartArray = [testPaidCart, testPaidCart];

jest.mock("../../src/dao/cartDAO");
jest.mock("../../src/dao/productDAO");
jest.mock("../../src/controllers/productController");

describe("Add a new product to cart", () => {
  test("Product added correctly", async () => {
    jest.spyOn(CartDAO.prototype, "addToUserCart").mockResolvedValueOnce(true);
    jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(testProduct);

    const controller = new CartController();

    const result = await controller.addToCart(testCustomer, testProduct.model);
    expect(result).toStrictEqual(true);
    expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledTimes(1);
    expect(ProductDAO.prototype.getProductByModel).toBeCalledWith(testProduct.model);
    expect(CartDAO.prototype.addToUserCart).toHaveBeenCalledTimes(1);
    expect(CartDAO.prototype.addToUserCart).toHaveBeenCalledWith(testCustomer.username, testProduct.model);
  });

  test("Product does not exist. Should reject with a ProductNotFoundError", async () => {
    const error = new ProductNotFoundError();

    jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(error);

    const controller = new CartController();

    const result = controller.addToCart(testCustomer, testProduct.model);
    await expect(result).rejects.toStrictEqual(error);
    expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled();
    expect(ProductDAO.prototype.getProductByModel).toBeCalledWith(testProduct.model);
  });

  test("Product quantity available is zero. Should reject with a EmptyProductStockError", async () => {
    const error = new EmptyProductStockError();

    jest
      .spyOn(ProductDAO.prototype, "getProductByModel")
      .mockResolvedValueOnce({ ...testProduct, quantity: 0 });

    const controller = new CartController();

    const result = controller.addToCart(testCustomer, testProduct.model);
    await expect(result).rejects.toStrictEqual(error);
    expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled();
    expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith(testProduct.model);
  });
});

describe("Get current cart, cartHistory and get all carts", () => {
  test("Get current cart, not empty", async () => {
    jest.spyOn(CartDAO.prototype, "getUserCurrentCart").mockResolvedValueOnce(testCart);

    const controller = new CartController();

    const result = controller.getCart(testCustomer);
    await expect(result).resolves.toStrictEqual(testCart);
    expect(CartDAO.prototype.getUserCurrentCart).toHaveBeenCalled();
    expect(CartDAO.prototype.getUserCurrentCart).toHaveBeenCalledWith(testCustomer.username);
  });

  test("Get current cart, empty", async () => {
    jest.spyOn(CartDAO.prototype, "getUserCurrentCart").mockResolvedValueOnce(undefined);
    jest.spyOn(CartDAO.prototype, "getDummyCart").mockReturnValueOnce(testCart);

    const controller = new CartController();

    const result = controller.getCart(testCustomer);
    await expect(result).resolves.toStrictEqual(testCart);
    expect(CartDAO.prototype.getUserCurrentCart).toHaveBeenCalled();
    expect(CartDAO.prototype.getUserCurrentCart).toHaveBeenCalledWith(testCustomer.username);
    expect(CartDAO.prototype.getDummyCart).toHaveBeenCalled();
    expect(CartDAO.prototype.getDummyCart).toHaveBeenCalledWith(testCustomer.username);
  });

  test("Get current cart, DB fails. Should reject with DB ERROR", async () => {
    const error = new Error("DB ERROR");

    jest.spyOn(CartDAO.prototype, "getUserCurrentCart").mockRejectedValueOnce(error);

    const controller = new CartController();

    const result = controller.getCart(testCustomer);
    await expect(result).rejects.toStrictEqual(error);
    expect(CartDAO.prototype.getUserCurrentCart).toHaveBeenCalled();
    expect(CartDAO.prototype.getUserCurrentCart).toHaveBeenCalledWith(testCustomer.username);
  });

  test("Get cart history", async () => {
    jest.spyOn(CartDAO.prototype, "getUserCarts").mockResolvedValueOnce(testCartArray);

    const controller = new CartController();

    const result = controller.getCustomerCarts(testCustomer);
    await expect(result).resolves.toStrictEqual(testCartArray.filter((c) => c.paid));
    expect(CartDAO.prototype.getUserCarts).toHaveBeenCalled();
    expect(CartDAO.prototype.getUserCarts).toHaveBeenCalledWith(testCustomer.username);
  });

  test("Get cart history, DB fails. Should reject with DB ERROR", async () => {
    const error = new Error("DB ERROR");

    jest.spyOn(CartDAO.prototype, "getUserCarts").mockRejectedValueOnce(error);

    const controller = new CartController();

    const result = controller.getCustomerCarts(testCustomer);
    await expect(result).rejects.toStrictEqual(error);
    expect(CartDAO.prototype.getUserCarts).toHaveBeenCalled();
    expect(CartDAO.prototype.getUserCarts).toHaveBeenCalledWith(testCustomer.username);
  });

  test("Get all carts", async () => {
    jest.spyOn(CartDAO.prototype, "getCarts").mockResolvedValueOnce(testCartArray);

    const controller = new CartController();

    const result = controller.getAllCarts();
    await expect(result).resolves.toStrictEqual(testCartArray);
    expect(CartDAO.prototype.getCarts).toHaveBeenCalled();
  });
});

describe("Remove product from cart", () => {
  test("Product removed from current cart correctly", async () => {
    jest.spyOn(CartDAO.prototype, "removeProductFromCart").mockResolvedValueOnce(true);

    const controller = new CartController();

    const result = controller.removeProductFromCart(testCustomer, testProduct.model);
    await expect(result).resolves.toStrictEqual(true);
    expect(CartDAO.prototype.removeProductFromCart).toHaveBeenCalled();
    expect(CartDAO.prototype.removeProductFromCart).toHaveBeenCalledWith(
      testCustomer.username,
      testProduct.model
    );
  });

  test("Product does not exist. Should reject with ProductNotFoundError", async () => {
    const error = new ProductNotFoundError();

    jest.spyOn(CartDAO.prototype, "removeProductFromCart").mockRejectedValueOnce(error);

    const controller = new CartController();

    const result = controller.removeProductFromCart(testCustomer, testProduct.model);
    await expect(result).rejects.toStrictEqual(error);
    expect(CartDAO.prototype.removeProductFromCart).toHaveBeenCalled();
    expect(CartDAO.prototype.removeProductFromCart).toHaveBeenCalledWith(
      testCustomer.username,
      testProduct.model
    );
  });

  test("Product is not in the cart. Should reject with ProductNotInCartError", async () => {
    const error = new ProductNotInCartError();

    jest.spyOn(CartDAO.prototype, "removeProductFromCart").mockRejectedValueOnce(error);

    const controller = new CartController();

    const result = controller.removeProductFromCart(testCustomer, testProduct.model);
    await expect(result).rejects.toStrictEqual(error);
    expect(CartDAO.prototype.removeProductFromCart).toHaveBeenCalled();
    expect(CartDAO.prototype.removeProductFromCart).toHaveBeenCalledWith(
      testCustomer.username,
      testProduct.model
    );
  });

  test("Product does not exist. Should reject with ProductNotFoundError", async () => {
    const error = new CartNotFoundError();

    jest.spyOn(CartDAO.prototype, "removeProductFromCart").mockRejectedValueOnce(error);

    const controller = new CartController();

    const result = controller.removeProductFromCart(testCustomer, testProduct.model);
    await expect(result).rejects.toStrictEqual(error);
    expect(CartDAO.prototype.removeProductFromCart).toHaveBeenCalled();
    expect(CartDAO.prototype.removeProductFromCart).toHaveBeenCalledWith(
      testCustomer.username,
      testProduct.model
    );
  });
});

describe("Remove all the product from the current cart", () => {
  test("All products removes correctly", async () => {
    jest.spyOn(CartDAO.prototype, "getCurrentCartId").mockResolvedValueOnce(1);
    jest.spyOn(CartDAO.prototype, "deleteUserCart").mockResolvedValueOnce(true);

    const controller = new CartController();

    const result = controller.clearCart(testCustomer);
    await expect(result).resolves.toStrictEqual(true);
    expect(CartDAO.prototype.getCurrentCartId).toHaveBeenCalled();
    expect(CartDAO.prototype.getCurrentCartId).toHaveBeenCalledWith(testCustomer.username);
    expect(CartDAO.prototype.deleteUserCart).toHaveBeenCalled();
    expect(CartDAO.prototype.deleteUserCart).toHaveBeenCalledWith(1);
  });

  test("Clear cart, DB fails. Should reject with DB ERROR", async () => {
    const error = new Error("DB ERROR");

    jest.spyOn(CartDAO.prototype, "getCurrentCartId").mockResolvedValueOnce(1);
    jest.spyOn(CartDAO.prototype, "deleteUserCart").mockRejectedValueOnce(error);

    const controller = new CartController();

    const result = controller.clearCart(testCustomer);
    await expect(result).rejects.toStrictEqual(error);
    expect(CartDAO.prototype.getCurrentCartId).toHaveBeenCalled();
    expect(CartDAO.prototype.getCurrentCartId).toHaveBeenCalledWith(testCustomer.username);
    expect(CartDAO.prototype.deleteUserCart).toHaveBeenCalled();
    expect(CartDAO.prototype.deleteUserCart).toHaveBeenCalledWith(1);
  });

  test("The current cart does not exist. Should reject with CartNotFoundError", async () => {
    const error = new CartNotFoundError();

    jest.spyOn(CartDAO.prototype, "getCurrentCartId").mockResolvedValue(undefined);

    const controller = new CartController();

    const result = controller.clearCart(testCustomer);
    await expect(result).rejects.toStrictEqual(error);
    expect(CartDAO.prototype.getCurrentCartId).toHaveBeenCalled();
    expect(CartDAO.prototype.getCurrentCartId).toHaveBeenCalledWith(testCustomer.username);
  });
});

describe("Delete all the carts", () => {
  test("All the carts correctly deleted", async () => {
    jest.spyOn(CartDAO.prototype, "deleteAllCarts").mockResolvedValueOnce(true);

    const controller = new CartController();

    const result = controller.deleteAllCarts();
    await expect(result).resolves.toStrictEqual(true);
    expect(CartDAO.prototype.deleteAllCarts).toHaveBeenCalled();
  });
});

describe("Checkout cart", () => {
  test("Cart checkout successful", async () => {
    jest.spyOn(CartDAO.prototype, "checkoutUserCart").mockResolvedValueOnce(true);
    jest.spyOn(CartDAO.prototype, "getUserCurrentCart").mockResolvedValueOnce(testCart);
    jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(1);
    jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([testProduct]);

    const controller = new CartController();

    const result = controller.checkoutCart(testCustomer);
    await expect(result).resolves.toStrictEqual(true);
    expect(CartDAO.prototype.checkoutUserCart).toHaveBeenCalled();
    expect(CartDAO.prototype.checkoutUserCart).toHaveBeenCalledWith(testCustomer.username);
    expect(CartDAO.prototype.getUserCurrentCart).toHaveBeenCalled();
    expect(CartDAO.prototype.getUserCurrentCart).toHaveBeenCalledWith(testCustomer.username);
    expect(ProductController.prototype.sellProduct).toHaveBeenCalled();
    expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith(
      testProduct.model,
      testCart.products[0].quantity,
      testCart.paymentDate
    );
    expect(ProductController.prototype.getProducts).toHaveBeenCalled();
    expect(ProductController.prototype.getProducts).toHaveBeenCalledWith(null, null, null);
  });

  test("Cart does not exist. Should reject with CartNotFoundError", async () => {
    const error = new CartNotFoundError();

    jest.spyOn(CartDAO.prototype, "getUserCurrentCart").mockResolvedValueOnce(undefined);

    const controller = new CartController();

    const result = controller.checkoutCart(testCustomer);
    await expect(result).rejects.toStrictEqual(error);
    expect(CartDAO.prototype.getUserCurrentCart).toHaveBeenCalled();
    expect(CartDAO.prototype.getUserCurrentCart).toHaveBeenCalledWith(testCustomer.username);
  });

  test("Cart is empty. Should reject with EmptyCartError", async () => {
    const error = new EmptyCartError();

    jest.spyOn(CartDAO.prototype, "getUserCurrentCart").mockResolvedValueOnce(testCartEmpty);

    const controller = new CartController();

    const result = controller.checkoutCart(testCustomer);
    await expect(result).rejects.toStrictEqual(error);
    expect(CartDAO.prototype.getUserCurrentCart).toHaveBeenCalled();
    expect(CartDAO.prototype.getUserCurrentCart).toHaveBeenCalledWith(testCustomer.username);
  });

  test("Product in cart could not respond with the quantity requested. Should reject with LowProductStockError", async () => {
    const error = new LowProductStockError();

    jest.spyOn(CartDAO.prototype, "getUserCurrentCart").mockResolvedValueOnce(testCartError);
    jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([testProduct]);

    const controller = new CartController();

    const result = controller.checkoutCart(testCustomer);
    await expect(result).rejects.toStrictEqual(error);
    expect(CartDAO.prototype.checkoutUserCart).toHaveBeenCalled();
    expect(CartDAO.prototype.checkoutUserCart).toHaveBeenCalledWith(testCustomer.username);
    expect(ProductController.prototype.getProducts).toHaveBeenCalled();
    expect(ProductController.prototype.getProducts).toHaveBeenCalledWith(null, null, null);
  });

  test("Checkout user cart fail. Should resolve with false", async () => {
    jest.spyOn(CartDAO.prototype, "getUserCurrentCart").mockResolvedValueOnce(testCart);
    jest.spyOn(CartDAO.prototype, "checkoutUserCart").mockResolvedValueOnce(0);
    jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([testProduct]);

    const controller = new CartController();

    const result = controller.checkoutCart(testCustomer);
    await expect(result).resolves.toStrictEqual(false);
    expect(CartDAO.prototype.getUserCurrentCart).toHaveBeenCalled();
    expect(CartDAO.prototype.getUserCurrentCart).toHaveBeenCalledWith(testCustomer.username);
    expect(CartDAO.prototype.checkoutUserCart).toHaveBeenCalled();
    expect(CartDAO.prototype.checkoutUserCart).toHaveBeenCalledWith(testCustomer.username);
    expect(ProductController.prototype.getProducts).toHaveBeenCalled();
    expect(ProductController.prototype.getProducts).toHaveBeenCalledWith(null, null, null);
  });

  test("Checkout user cart, DB fails. Should reject with DB ERROR", async () => {
    const error = new Error("DB ERROR");

    jest.spyOn(CartDAO.prototype, "getUserCurrentCart").mockRejectedValueOnce(error);

    const controller = new CartController();

    const result = controller.checkoutCart(testCustomer);
    await expect(result).rejects.toStrictEqual(error);
    expect(CartDAO.prototype.getUserCurrentCart).toHaveBeenCalled();
    expect(CartDAO.prototype.getUserCurrentCart).toHaveBeenCalledWith(testCustomer.username);
  });
});
