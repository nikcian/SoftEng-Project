import { describe, test, expect, beforeAll, beforeEach, afterAll, afterEach, jest } from "@jest/globals";

import productController from "../../src/controllers/productController";
import db from "../../src/db/db";
import { Database } from "sqlite3";
import { SpyInstance } from "jest-mock";
import ProductDAO from "../../src/dao/productDAO";
import { Category, Product } from "../../src/components/product";
import { ProductAlreadyExistsError, ProductNotFoundError } from "../../src/errors/productError";

let productDAO: ProductDAO;

jest.mock("../../src/db/db.ts");

describe("Insert product", () => {
  beforeEach(() => {
    productDAO = new ProductDAO();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test("Product correctly registered", async () => {
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(null);
      return {} as Database;
    });

    const result = await productDAO.insertProduct(
      new Product(150, "prova", Category.APPLIANCE, null, null, 10)
    );
    expect(result).toBe(true);
    expect(mockDBRun).toHaveBeenCalled();
  });

  test("Product already exists", async () => {
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(new Error(""));
      return {} as Database;
    });

    const result = productDAO.insertProduct(
      new Product(150, "prova prodotto esistente", Category.APPLIANCE, null, null, 10)
    );
    await expect(result).rejects.toEqual(new ProductAlreadyExistsError());
    expect(mockDBRun).toHaveBeenCalled();
  });

  test("Product provides empty parameters", async () => {
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(new Error(""));
      return {} as Database;
    });

    const result = productDAO.insertProduct(
      new Product(150, "prova parametri vuoti", Category.APPLIANCE, null, null, 10)
    );
    await expect(result).rejects.toEqual(new ProductAlreadyExistsError());
    expect(mockDBRun).toHaveBeenCalled();
  });
});

describe("Delete product", () => {
  beforeEach(() => {
    productDAO = new ProductDAO();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test("All products correctly deleted", async () => {
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(null);
      return {} as Database;
    });

    const result = await productDAO.deleteProducts();
    expect(result).toBe(true);
    expect(mockDBRun).toHaveBeenCalled();
  });

  test("All Products not deleted", async () => {
    const errore= new Error("Errore prodotti");
    jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(errore, null);
      return {} as Database;
    });

    await expect(productDAO.deleteProducts()).rejects.toThrow(errore);
  });

  test("Product correctly deleted", async () => {
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(null);
      return {} as Database;
    });

    const result = await productDAO.deleteProductByModel("iPhone 15");
    expect(result).toBe(true);
    expect(mockDBRun).toHaveBeenCalled();
  });

  test("Product not found", async () => {
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(new ProductNotFoundError());
      return {} as Database;
    });

    const result = productDAO.deleteProductByModel("prodottononesistente");
    await expect(result).rejects.toEqual(new ProductNotFoundError());
    expect(mockDBRun).toHaveBeenCalled();
  });
});

describe("Update product", () => {
  beforeEach(() => {
    productDAO = new ProductDAO();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test("Product correctly updated", async () => {
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(null);
      return {} as Database;
    });

    const result = await productDAO.updateProduct(
      new Product(150, "prova", Category.APPLIANCE, null, null, 10),
      "prova"
    );
    expect(result).toBe(true);
    expect(mockDBRun).toHaveBeenCalled();
  });

  test("Product not updated", async () => {
    const errore= new Error("Errore prodotti");
    jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
      callback(errore, null);
      return {} as Database;
    });

    await expect(productDAO.updateProduct(new Product(150, "prova", Category.APPLIANCE, null, null, 10),
      "provaerrore")).rejects.toThrow(errore);
  });


});


describe("View product", () => {
  beforeEach(() => {
    productDAO = new ProductDAO();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test("view Product by model", async () => {
    const mockProduct = { sellingPrice: 15.00, model: "provagetproduct", category: Category.LAPTOP, arrivalDate: "", details: "provaget", quantity: 12 }
    //  { sellingPrice: 15.00, model: "provagetproduct2", category: Category.APPLIANCE, arrivalDate: "", details: "provaget2", quantity: 34 },
  ;
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
      callback(null, mockProduct);
      return {} as Database;
    });

    const result = await productDAO.getProductByModel("provagetproduct");
    expect(result).toStrictEqual(new Product(mockProduct.sellingPrice, mockProduct.model, mockProduct.category, mockProduct.arrivalDate, mockProduct.details, mockProduct.quantity));
    expect(mockDBGet).toHaveBeenCalled();
  });

  test("view Products", async () => {
    const mockProduct = [{ sellingPrice: 15.00, model: "provagetproduct", category: Category.LAPTOP, arrivalDate: "", details: "provaget", quantity: 12 },
     { sellingPrice: 15.00, model: "provagetproduct2", category: Category.APPLIANCE, arrivalDate: "", details: "provaget2", quantity: 34 },
    ];
    const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
      callback(null, mockProduct);
      return {} as Database;
    });

    const result = await productDAO.getProducts();
    expect(result).toStrictEqual([new Product(mockProduct[0].sellingPrice, mockProduct[0].model, mockProduct[0].category, mockProduct[0].arrivalDate, mockProduct[0].details, mockProduct[0].quantity),
    new Product(mockProduct[1].sellingPrice, mockProduct[1].model, mockProduct[1].category, mockProduct[1].arrivalDate, mockProduct[1].details, mockProduct[1].quantity)]);
    expect(mockDBAll).toHaveBeenCalled();
  });

  test("view Products errore", async () => {
    const errore= new Error("Errore prodotti");
    jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
      callback(errore, null);
      return {} as Database;
    });

    await expect(productDAO.getProducts()).rejects.toThrow(errore);
    
  });

  test("Error handling: No product found", async () => {
    
    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
       throw new Error("ProductNotFoundError")
        return {} as Database;
    });

    // Chiamata alla funzione getProductByModel che dovrebbe rigettare una ProductNotFoundError
    expect(productDAO.getProductByModel("modellononesistente")).rejects.toThrow((new Error("ProductNotFoundError")));

    // Verifica che db.get sia stata chiamata correttamente
    expect(mockDBGet).toHaveBeenCalledWith(
      "SELECT * FROM PRODUCTS WHERE model = ?",
      ["modellononesistente"],
        expect.any(Function)
    );
});


  test("Error: product not found get product", async()=>{
    const mockError = new Error("Database query getproductByModel error");
      const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(mockError, null);
        return {} as Database;
      });

      const result = productDAO.getProductByModel("prodottononesistente");
      await expect(result).rejects.toThrow((mockError));
      expect(mockDBGet).toHaveBeenCalled();
    });
 
});