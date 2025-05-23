import { describe, test, jest, expect, beforeEach, afterEach } from "@jest/globals";
import db from "../../src/db/db";
import { Database } from "sqlite3";
import CartDAO from "../../src/dao/cartDAO";
import { Cart, ProductInCart } from "../../src/components/cart";
import { ProductNotFoundError } from "../../src/errors/productError";

jest.mock("../../src/db/db.ts");

let cartDAO: CartDAO;

let testCustomerUsername = "customer";
let testCustomerID = 2;
let testCustomerCartID = 1;
let testCartRows: any = [
  {
    cartID: testCustomerCartID,
    username: testCustomerUsername,
    paid: 0,
    paymentDate: "",
  },
];
let testProductInCartRows: any = [
  {
    cartID: testCustomerCartID,
    selliingPrice: 100,
    model: "iPhone 16",
    category: "Smartphone",
    quantity: 2,
    total: 200,
  },
];
let testCartResult: Cart = new Cart(
  testCartRows[0].username,
  testCartRows[0].paid,
  testCartRows[0].paymentDate,
  testProductInCartRows[0].total,
  [
    new ProductInCart(
      testProductInCartRows[0].model,
      testProductInCartRows[0].quantity,
      testProductInCartRows[0].category,
      testProductInCartRows[0].sellingPrice
    ),
  ]
);
let testProduct = {
  id: 1,
  model: "iPhone 16",
  quantity: 10,
  sellingPrice: 100,
  category: "Smartphone",
};

describe("Unit test for CartDAO", () => {
  beforeEach(async () => {
    cartDAO = new CartDAO();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe("getCarts", () => {
    test("All carts retrieved correctly", async () => {
      const mockDBAll1 = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
        callback(null, testCartRows);
        return {} as Database;
      });

      const mockDBAll2 = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
        callback(null, testProductInCartRows);
        return {} as Database;
      });

      const result = cartDAO.getCarts();
      await expect(result).resolves.toStrictEqual([testCartResult]);
      expect(mockDBAll1).toHaveBeenCalled();
      expect(mockDBAll2).toHaveBeenCalled();
    });

    test("First db all call fails. DB FAILS", async () => {
      const error = new Error("DB ERROR");

      const mockDBAll = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
        callback(error);
        return {} as Database;
      });

      const result = cartDAO.getCarts();
      await expect(result).rejects.toStrictEqual(error);
      expect(mockDBAll).toHaveBeenCalled();
    });

    test("Second db all fails. DB FAILS", async () => {
      const error = new Error("DB ERROR");

      const mockDBAll1 = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
        callback(null, testCartRows);
        return {} as Database;
      });

      const mockDBAll2 = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
        callback(error);
        return {} as Database;
      });

      const result = cartDAO.getCarts();
      await expect(result).rejects.toStrictEqual(error);
      expect(mockDBAll1).toHaveBeenCalled();
      expect(mockDBAll2).toHaveBeenCalled();
    });
  });

  describe("getUserCarts", () => {
    test("All user carts retrieved correctly", async () => {
      const mockDBAll1 = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
        callback(null, testCartRows);
        return {} as Database;
      });

      const mockDBAll2 = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
        callback(null, testProductInCartRows);
        return {} as Database;
      });

      const result = cartDAO.getUserCarts(testCartRows[0].username);
      await expect(result).resolves.toStrictEqual([testCartResult]);
      expect(mockDBAll1).toHaveBeenCalled();
      expect(mockDBAll2).toHaveBeenCalled();
    });

    test("First db all call fails. DB FAILS", async () => {
      const error = new Error("DB ERROR");

      const mockDBAll = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
        callback(error);
        return {} as Database;
      });

      const result = cartDAO.getUserCarts(testCartRows[0].username);
      await expect(result).rejects.toStrictEqual(error);
      expect(mockDBAll).toHaveBeenCalled();
    });

    test("Second db all fails. DB FAILS", async () => {
      const error = new Error("DB ERROR");

      const mockDBAll1 = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
        callback(null, testCartRows);
        return {} as Database;
      });

      const mockDBAll2 = jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
        callback(error);
        return {} as Database;
      });

      const result = cartDAO.getUserCarts(testCartRows[0].username);
      await expect(result).rejects.toStrictEqual(error);
      expect(mockDBAll1).toHaveBeenCalled();
      expect(mockDBAll2).toHaveBeenCalled();
    });
  });

  describe("getUserCurrentCart", () => {
    test("User current cart retrieved correctly", async () => {
      jest.spyOn(CartDAO.prototype, "getUserCarts").mockResolvedValueOnce([testCartResult]);

      const result = cartDAO.getUserCurrentCart(testCustomerUsername);
      await expect(result).resolves.toStrictEqual(testCartResult);
      expect(CartDAO.prototype.getUserCarts).toHaveBeenCalled();
      expect(CartDAO.prototype.getUserCarts).toHaveBeenCalledWith(testCustomerUsername);
    });

    test("User does not have carts", async () => {
      jest.spyOn(CartDAO.prototype, "getUserCarts").mockResolvedValueOnce([]);

      const result = cartDAO.getUserCurrentCart(testCustomerUsername);
      await expect(result).resolves.toStrictEqual(undefined);
      expect(CartDAO.prototype.getUserCarts).toHaveBeenCalled();
      expect(CartDAO.prototype.getUserCarts).toHaveBeenCalledWith(testCustomerUsername);
    });

    test("GetUserCarts call fails, DB FAILS", async () => {
      const error = new Error("DB ERROR");

      jest.spyOn(CartDAO.prototype, "getUserCarts").mockRejectedValueOnce(error);

      const result = cartDAO.getUserCurrentCart(testCustomerUsername);
      await expect(result).rejects.toStrictEqual(error);
      expect(CartDAO.prototype.getUserCarts).toHaveBeenCalled();
      expect(CartDAO.prototype.getUserCarts).toHaveBeenCalledWith(testCustomerUsername);
    });
  });

  describe("getDummyCart", () => {
    test("Dummy cart retrieved correctly", async () => {
      const result = cartDAO.getDummyCart(testCustomerUsername);

      expect(result).toStrictEqual(new Cart(testCustomerUsername, false, null, 0, []));
    });
  });

  describe("getCurrentCartID", () => {
    test("Cart id retrieved correctly", async () => {
      const mockDBGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(null, { cartID: testCustomerCartID });
        return {} as Database;
      });

      const result = cartDAO.getCurrentCartId(testCustomerUsername);
      await expect(result).resolves.toStrictEqual(testCustomerCartID);
      expect(mockDBGet).toHaveBeenCalled();
    });

    test("Customer does not have a current cart", async () => {
      const mockDBGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(null, undefined);
        return {} as Database;
      });

      const result = cartDAO.getCurrentCartId(testCustomerUsername);
      await expect(result).resolves.toStrictEqual(undefined);
      expect(mockDBGet).toHaveBeenCalled();
    });

    test("Db get call fails, DB FAILS", async () => {
      const error = new Error("DB ERROR");

      const mockDBGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(error);
        return {} as Database;
      });

      const result = cartDAO.getCurrentCartId(testCustomerUsername);
      await expect(result).rejects.toStrictEqual(error);
      expect(mockDBGet).toHaveBeenCalled();
    });
  });

  describe("insertNewProductInCart", () => {
    test("Product inserted in cart correctly", async () => {
      const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
        callback.call({ changes: 1 }, null);
        return {} as Database;
      });

      const result = cartDAO.insertNewProductInCart(testCustomerCartID, testProduct.id, 1);
      await expect(result).resolves.toStrictEqual(true);
      expect(mockDBRun).toHaveBeenCalled();
    });

    test("Product not inserted in cart", async () => {
      const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
        callback.call({ changes: 0 }, null);
        return {} as Database;
      });

      const result = cartDAO.insertNewProductInCart(testCustomerCartID, testProduct.id, 1);
      await expect(result).resolves.toStrictEqual(false);
      expect(mockDBRun).toHaveBeenCalled();
    });

    test("Db run call fails, DB FAILS", async () => {
      const error = new Error("DB ERROR");

      const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
        callback.call({ changes: 0 }, error);
        return {} as Database;
      });

      const result = cartDAO.insertNewProductInCart(testCustomerCartID, testProduct.id, 1);
      await expect(result).rejects.toStrictEqual(error);
      expect(mockDBRun).toHaveBeenCalled();
    });
  });

  describe("createNewCart", () => {
    test("New cart created correctly", async () => {
      const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, testCustomerID);
        return {} as Database;
      });

      const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback.call({ changes: 1 }, null);
        return {} as Database;
      });

      jest.spyOn(CartDAO.prototype, "getCurrentCartId").mockResolvedValueOnce(testCustomerCartID);
      jest.spyOn(CartDAO.prototype, "insertNewProductInCart").mockResolvedValueOnce(true);

      const result = cartDAO.createNewCart(testCustomerUsername, testProduct.id);

      await expect(result).resolves.toStrictEqual(true);
      expect(mockDBGet).toHaveBeenCalled();
      expect(mockDBRun).toHaveBeenCalled();
      expect(CartDAO.prototype.getCurrentCartId).toHaveBeenCalled();
      expect(CartDAO.prototype.getCurrentCartId).toHaveBeenCalledWith(testCustomerUsername);
      expect(CartDAO.prototype.insertNewProductInCart).toHaveBeenCalled();
      expect(CartDAO.prototype.insertNewProductInCart).toHaveBeenCalledWith(
        testCustomerCartID,
        testProduct.id,
        1
      );
    });

    test("There is no user with the provided username", async () => {
      const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, undefined);
        return {} as Database;
      });

      const result = cartDAO.createNewCart(testCustomerUsername, testProduct.id);

      await expect(result).resolves.toStrictEqual(false);
      expect(mockDBGet).toHaveBeenCalled();
    });

    test("The user cart has not been created correctly", async () => {
      const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, testCustomerID);
        return {} as Database;
      });

      const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback.call({ changes: 1 }, null);
        return {} as Database;
      });

      jest.spyOn(CartDAO.prototype, "getCurrentCartId").mockResolvedValueOnce(undefined);

      const result = cartDAO.createNewCart(testCustomerUsername, testProduct.id);

      await expect(result).resolves.toStrictEqual(false);
      expect(mockDBGet).toHaveBeenCalled();
      expect(mockDBRun).toHaveBeenCalled();
      expect(CartDAO.prototype.getCurrentCartId).toHaveBeenCalled();
      expect(CartDAO.prototype.getCurrentCartId).toHaveBeenCalledWith(testCustomerUsername);
    });

    test("Db get call fails, DB FAILS", async () => {
      const error = new Error("DB ERROR");

      const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(error, undefined);
        return {} as Database;
      });

      const result = cartDAO.createNewCart(testCustomerUsername, testProduct.id);

      await expect(result).rejects.toStrictEqual(error);
      expect(mockDBGet).toHaveBeenCalled();
    });

    test("Db run call fails, DB FAILS", async () => {
      const error = new Error("DB ERROR");

      const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, testCustomerID);
        return {} as Database;
      });

      const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback.call({ changes: 0 }, error);
        return {} as Database;
      });

      const result = cartDAO.createNewCart(testCustomerUsername, testProduct.id);

      await expect(result).rejects.toStrictEqual(error);
      expect(mockDBGet).toHaveBeenCalled();
      expect(mockDBRun).toHaveBeenCalled();
    });
  });

  describe("checkoutUserCart", () => {
    test("Checkout user cart done correctly", async () => {
      const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, testCustomerCartID);
        return {} as Database;
      });

      const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback.call({ changes: 1 }, null);
        return {} as Database;
      });

      const result = cartDAO.checkoutUserCart(testCustomerUsername);

      await expect(result).resolves.toStrictEqual(1);
      expect(mockDBGet).toHaveBeenCalled();
      expect(mockDBRun).toHaveBeenCalled();
    });

    test("User does not have a current cart", async () => {
      const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, undefined);
        return {} as Database;
      });

      const result = cartDAO.checkoutUserCart(testCustomerUsername);

      await expect(result).resolves.toStrictEqual({ error: "This user doesn't have a current cart" });
      expect(mockDBGet).toHaveBeenCalled();
    });

    test("Db get call fails, DB FAILS", async () => {
      const error = new Error("DB ERROR");

      const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(error);
        return {} as Database;
      });

      const result = cartDAO.checkoutUserCart(testCustomerUsername);

      await expect(result).rejects.toStrictEqual(error);
      expect(mockDBGet).toHaveBeenCalled();
    });

    test("Db run call fails, DB FAILS", async () => {
      const error = new Error("DB ERROR");

      const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, testCustomerCartID);
        return {} as Database;
      });

      const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback.call({ changes: 0 }, error);
        return {} as Database;
      });

      const result = cartDAO.checkoutUserCart(testCustomerUsername);

      await expect(result).rejects.toStrictEqual(error);
      expect(mockDBGet).toHaveBeenCalled();
      expect(mockDBRun).toHaveBeenCalled();
    });
  });

  describe("getProductIdFromModel", () => {
    test("Product ID got correctly", async () => {
      const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, { productID: testProduct.id });
        return {} as Database;
      });

      const result = cartDAO.getProductIdFromModel(testProduct.model);
      await expect(result).resolves.toStrictEqual(testProduct.id);
      expect(mockDBGet).toHaveBeenCalled();
    });

    test("Product ID not found", async () => {
      const error = new ProductNotFoundError();

      const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, undefined);
        return {} as Database;
      });

      const result = cartDAO.getProductIdFromModel(testProduct.model);
      await expect(result).rejects.toStrictEqual(error);
      expect(mockDBGet).toHaveBeenCalled();
    });

    test("Db get call fails, DB FAILS", async () => {
      const error = new Error("DB ERROR");

      const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(error);
        return {} as Database;
      });

      const result = cartDAO.getProductIdFromModel(testProduct.model);
      await expect(result).rejects.toStrictEqual(error);
      expect(mockDBGet).toHaveBeenCalled();
    });
  });

  describe("updateCartProductRecord", () => {
    test("Product record updated correctly", async () => {
      const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
        callback.call({ changes: 1 }, null);
        return {} as Database;
      });

      const result = cartDAO.updateCartProductRecord(testCustomerCartID, testProduct.id, 1);
      await expect(result).resolves.toStrictEqual(1);
      expect(mockDBRun).toHaveBeenCalled();
    });

    test("Db run call fails, DB FAILS", async () => {
      const error = new Error("DB ERROR");

      const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
        callback.call({ changes: 0 }, error);
        return {} as Database;
      });

      const result = cartDAO.updateCartProductRecord(testCustomerCartID, testProduct.id, 1);
      await expect(result).rejects.toStrictEqual(error);
      expect(mockDBRun).toHaveBeenCalled();
    });
  });

  describe("deleteCartProductRecord", () => {
    test("Product record deleted correctly", async () => {
      const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
        callback.call({ changes: 1 }, null);
        return {} as Database;
      });

      const result = cartDAO.deleteCartProductRecord(testCustomerCartID, testProduct.id);
      await expect(result).resolves.toStrictEqual(1);
      expect(mockDBRun).toHaveBeenCalled();
    });

    test("Db run call fails, DB FAILS", async () => {
      const error = new Error("DB ERROR");

      const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
        callback.call({ changes: 0 }, error);
        return {} as Database;
      });

      const result = cartDAO.deleteCartProductRecord(testCustomerCartID, testProduct.id);
      await expect(result).rejects.toStrictEqual(error);
      expect(mockDBRun).toHaveBeenCalled();
    });
  });

  describe("deleteUserCart", () => {
    test("User cart deleted correctly", async () => {
      const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
        callback.call(true, null);
        return {} as Database;
      });

      const result = cartDAO.deleteUserCart(testCustomerCartID);
      await expect(result).resolves.toStrictEqual(true);
      expect(mockDBRun).toHaveBeenCalled();
    });

    test("Db run call fails, DB FAILS", async () => {
      const error = new Error("DB ERROR");

      const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
        callback.call({ changes: 0 }, error);
        return {} as Database;
      });

      const result = cartDAO.deleteUserCart(testCustomerCartID);
      await expect(result).rejects.toStrictEqual(error);
      expect(mockDBRun).toHaveBeenCalled();
    });
  });

  describe("deleteAllCarts", () => {
    test("All carts deleted correctly", async () => {
      const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
        callback.call(true, null);
        return {} as Database;
      });

      const result = cartDAO.deleteAllCarts();
      await expect(result).resolves.toStrictEqual(true);
      expect(mockDBRun).toHaveBeenCalled();
    });

    test("Db run call fails, DB FAILS", async () => {
      const error = new Error("DB ERROR");

      const mockDBRun = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
        callback.call({ changes: 0 }, error);
        return {} as Database;
      });

      const result = cartDAO.deleteAllCarts();
      await expect(result).rejects.toStrictEqual(error);
      expect(mockDBRun).toHaveBeenCalled();
    });
  });

  describe("editProductInCartQuantity", () => {
    test("Product edited correctly", async () => {
      const mockGetProduct = jest
        .spyOn(CartDAO.prototype, "getProductIdFromModel")
        .mockResolvedValueOnce(testProduct.id);
      const mockGetCart = jest
        .spyOn(CartDAO.prototype, "getUserCurrentCart")
        .mockResolvedValueOnce(testCartResult);
      const mockUpdateCart = jest
        .spyOn(CartDAO.prototype, "updateCartProductRecord")
        .mockResolvedValueOnce(1);
      const result = cartDAO.editProductInCartQuantity(
        testCustomerCartID,
        testCustomerUsername,
        testProduct.model,
        1
      );
      await expect(result).resolves.toBe(true);
      expect(mockGetProduct).toHaveBeenCalled();
      expect(mockGetCart).toHaveBeenCalled();
      expect(mockUpdateCart).toHaveBeenCalled();
    });

    test("Product deleted", async () => {
      const mockGetProduct = jest
        .spyOn(CartDAO.prototype, "getProductIdFromModel")
        .mockResolvedValueOnce(testProduct.id);
      const mockGetCart = jest
        .spyOn(CartDAO.prototype, "getUserCurrentCart")
        .mockResolvedValueOnce(testCartResult);
      const mockDeleteCart = jest
        .spyOn(CartDAO.prototype, "deleteCartProductRecord")
        .mockResolvedValueOnce(1);
      const result = cartDAO.editProductInCartQuantity(
        testCustomerCartID,
        testCustomerUsername,
        testProduct.model,
        -2
      );
      await expect(result).resolves.toBe(true);
      expect(mockGetProduct).toHaveBeenCalled();
      expect(mockGetCart).toHaveBeenCalled();
      expect(mockDeleteCart).toHaveBeenCalled();
    });

    test("Product not found error", async () => {
      const mockGetProduct = jest
        .spyOn(CartDAO.prototype, "getProductIdFromModel")
        .mockRejectedValueOnce(new ProductNotFoundError());
      const result = cartDAO.editProductInCartQuantity(
        testCustomerCartID,
        testCustomerUsername,
        testProduct.model,
        -2
      );
      await expect(result).rejects.toStrictEqual(new ProductNotFoundError());
      expect(mockGetProduct).toHaveBeenCalled();
    });
  });

  describe("addToUserCart", () => {
    test("Add/remove existing product to cart (quantity increase/decrease UPDATE) - should return true", async () => {
      const mockDBGet_addToUserCart = jest
        .spyOn(db, "get")
        .mockImplementationOnce((sql, params, callback) => {
          callback(null, 1); // ProductId
          return {} as Database;
        });
      // Assuming that the cart exists
      const mock_getCurrentCartId = jest
        .spyOn(CartDAO.prototype, "getCurrentCartId")
        .mockResolvedValueOnce(testCustomerCartID);
      // Assuming that the product is already inside the cart (quantity UPDATE)
      const mock_getUserCurrentCart = jest
        .spyOn(CartDAO.prototype, "getUserCurrentCart")
        .mockResolvedValueOnce(testCartResult);
      // Assuming that the product to add exists
      const mock_DBGet_getProductIdFromModel = jest
        .spyOn(db, "get")
        .mockImplementationOnce((sql, params, callback) => {
          callback(null, 1); // ProductId
          return {} as Database;
        });
      const mock_DBRun_updateCartProductRecord = jest
        .spyOn(db, "run")
        .mockImplementationOnce((sql, params, callback) => {
          callback.call({ changes: 1 }, null); // this, error, rows
          return {} as Database;
        });

      const result = await cartDAO.addToUserCart(testCustomerUsername, testProductInCartRows[0].model);
      expect(result).toBe(true);
      expect(mockDBGet_addToUserCart).toHaveBeenCalled();
      expect(mock_getCurrentCartId).toHaveBeenCalled();
      expect(mock_DBGet_getProductIdFromModel).toHaveBeenCalled();
      expect(mock_getUserCurrentCart).toHaveBeenCalled();
      expect(mock_DBRun_updateCartProductRecord).toHaveBeenCalled();
    });

    test("Db get call fails (inside addToUserCart)", async () => {
      const error = new Error("DB ERROR");
      const mockDBGet = jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
        callback(error);
        return {} as Database;
      });

      const result = cartDAO.addToUserCart(testCustomerUsername, "test-model");
      await expect(result).rejects.toThrow(error);
      expect(mockDBGet).toHaveBeenCalled();
    });
    test("Product does not exists - should return false", async () => {
      const mockDBGet_addToUserCart = jest
        .spyOn(db, "get")
        .mockImplementationOnce((sql, params, callback) => {
          callback(null, undefined); // ProductId
          return {} as Database;
        });

      const result = cartDAO.addToUserCart(testCustomerUsername, testProductInCartRows[0].model);
      await expect(result).resolves.toBe(false);
      expect(mockDBGet_addToUserCart).toHaveBeenCalled();
    });

    test("Current cart does not exists - should create a new cart, then add the product, finally return true", async () => {
      // assuming that the product exists
      const mockDBGet_addToUserCart = jest
        .spyOn(db, "get")
        .mockImplementationOnce((sql, params, callback) => {
          callback(null, 1); // ProductId
          return {} as Database;
        });
      // Assuming that current cart does not exists (first call) and must be created successfully (second call)
      const mock_getCurrentCartId = jest
        .spyOn(CartDAO.prototype, "getCurrentCartId")
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(testCustomerCartID);
      //const mock_getCurrentCartId_after_createNewCart = jest.spyOn(CartDAO.prototype, "getCurrentCartId").mockResolvedValueOnce(testCustomerCartID);
      const mock_getUserCurrentCart = jest
        .spyOn(CartDAO.prototype, "getUserCurrentCart")
        .mockResolvedValueOnce(undefined);
      // Assuming that the product to add exists
      const mock_DBGet_getProductIdFromModel = jest
        .spyOn(db, "get")
        .mockImplementationOnce((sql, params, callback) => {
          callback(null, 1); // ProductId
          return {} as Database;
        });
      // Create the new cart and add the product
      // Assuming that the username exists
      const mock_DBGet_createNewCart = jest
        .spyOn(db, "get")
        .mockImplementationOnce((sql, params, callback) => {
          callback(null, 1); // cartId
          return {} as Database;
        });
      // Assuming that the creation of the cart is successful
      const mock_DBRun_createNewCart = jest
        .spyOn(db, "run")
        .mockImplementationOnce((sql, params, callback) => {
          callback.call({ changes: 1 }, null); // this, error, rows
          return {} as Database;
        });
      // Assuming that the insertion of cartProduct record is successful
      const mock_DBRun_insertNewProductInCart = jest
        .spyOn(db, "run")
        .mockImplementationOnce((sql, params, callback) => {
          callback.call({ changes: 1 }, null); // this, error, rows
          return {} as Database;
        });

      const result = await cartDAO.addToUserCart(testCustomerUsername, testProductInCartRows[0].model);
      expect(result).toBe(true);
      expect(mockDBGet_addToUserCart).toHaveBeenCalled();
      expect(mock_getCurrentCartId).toHaveBeenCalled();
      //expect(mock_getCurrentCartId_after_createNewCart).toHaveBeenCalled();
      expect(mock_getUserCurrentCart).toHaveBeenCalled();
      expect(mock_DBGet_getProductIdFromModel).toHaveBeenCalled();
      expect(mock_DBGet_createNewCart).toHaveBeenCalled();
      expect(mock_DBRun_createNewCart).toHaveBeenCalled();
      expect(mock_DBRun_insertNewProductInCart).toHaveBeenCalled();
    });

    test("Insert a new product to cart - should return true", async () => {
      const mockDBGet_addToUserCart = jest
        .spyOn(db, "get")
        .mockImplementationOnce((sql, params, callback) => {
          callback(null, 1); // ProductId
          return {} as Database;
        });
      // Assuming that the cart exists
      const mock_getCurrentCartId = jest
        .spyOn(CartDAO.prototype, "getCurrentCartId")
        .mockResolvedValueOnce(testCustomerCartID);
      // Assuming that the product does not exists inside the cart (INSERT)
      const mock_getUserCurrentCart = jest
        .spyOn(CartDAO.prototype, "getUserCurrentCart")
        .mockResolvedValueOnce(undefined);
      // Assuming that the product to add exists
      const mock_DBGet_getProductIdFromModel = jest
        .spyOn(db, "get")
        .mockImplementationOnce((sql, params, callback) => {
          callback(null, 1); // ProductId
          return {} as Database;
        });
      const mock_DBRun_insertNewProductInCart = jest
        .spyOn(db, "run")
        .mockImplementationOnce((sql, params, callback) => {
          callback.call({ changes: 1 }, null); // this, error, rows
          return {} as Database;
        });

      const result = await cartDAO.addToUserCart(testCustomerUsername, testProductInCartRows[0].model);
      expect(result).toBe(true);
      expect(mockDBGet_addToUserCart).toHaveBeenCalled();
      expect(mock_getCurrentCartId).toHaveBeenCalled();
      expect(mock_DBGet_getProductIdFromModel).toHaveBeenCalled();
      expect(mock_getUserCurrentCart).toHaveBeenCalled();
      expect(mock_DBRun_insertNewProductInCart).toHaveBeenCalled();
    });
  });

  describe("removeProductFromCart", () => {
    test("Remove product from cart - should return true", async () => {
      let testCartResult_local: Cart = new Cart(
        testCartRows[0].username,
        testCartRows[0].paid,
        testCartRows[0].paymentDate,
        testProductInCartRows[0].total,
        [
          new ProductInCart(
            testProductInCartRows[0].model,
            1, // NOTE: productInCart Object must have quantity == 1 to trigger the delete method, instead of the update
            testProductInCartRows[0].category,
            testProductInCartRows[0].sellingPrice
          ),
        ]
      );

      const mockDBGet_addToUserCart = jest
        .spyOn(db, "get")
        .mockImplementationOnce((sql, params, callback) => {
          callback(null, 1); // ProductId
          return {} as Database;
        });
      // Assuming that the cart exists
      const mock_getCurrentCartId = jest
        .spyOn(CartDAO.prototype, "getCurrentCartId")
        .mockResolvedValueOnce(testCustomerCartID);
      // Assuming that the product is already inside the cart, with quantity == 1
      const mock_getUserCurrentCart = jest
        .spyOn(CartDAO.prototype, "getUserCurrentCart")
        .mockResolvedValue(testCartResult_local);
      // Assuming that the product to remove exists
      const mock_DBGet_getProductIdFromModel = jest
        .spyOn(db, "get")
        .mockImplementationOnce((sql, params, callback) => {
          callback(null, 1); // ProductId
          return {} as Database;
        });
      const mock_DBRun_deleteCartProductRecord = jest
        .spyOn(db, "run")
        .mockImplementationOnce((sql, params, callback) => {
          callback.call({ changes: 1 }, null); // this, error, rows
          return {} as Database;
        });

      const result = await cartDAO.removeProductFromCart(
        testCustomerUsername,
        testProductInCartRows[0].model
      );
      expect(result).toBe(true);
      expect(mockDBGet_addToUserCart).toHaveBeenCalled();
      expect(mock_getCurrentCartId).toHaveBeenCalled();
      expect(mock_DBGet_getProductIdFromModel).toHaveBeenCalled();
      expect(mock_getUserCurrentCart).toHaveBeenCalled();
      expect(mock_DBRun_deleteCartProductRecord).toHaveBeenCalled();
    });
  });
});
