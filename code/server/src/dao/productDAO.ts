/**
 * A class that implements the interaction with the database for all product-related operations.
 */

import db from "../db/db";

import { Product } from "../components/product";
import { ProductNotFoundError } from "../errors/productError";

function mapRowsToProduct(rows: any): Product[] {
  return rows.map(
    (row: any) =>
      new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity)
  );
}

class ProductDAO {
  /**
   * Returns all products in the database.
   * @returns A Promise that resolve to an array of Product objects.
   */
  getProducts(): Promise<Product[]> {
    return new Promise((resolve, reject) => {
      const query = "SELECT * FROM PRODUCTS";

      db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(mapRowsToProduct(rows));
        }
      });
    });
  }

  /**
   * Return the product in the database corresponding to the provided model.
   * @param model The unique model of the product.
   * @returns A Promise that resolve to a Product object.
   */
  getProductByModel(model: String): Promise<Product | ProductNotFoundError> {
    return new Promise((resolve, reject) => {
      const query = "SELECT * FROM PRODUCTS WHERE model = ?";

      db.get(query, [model], (err, row) => {
        if (err) {
          reject(err);
        } else if (row === undefined) {
          resolve(new ProductNotFoundError());
        } else {
          resolve(mapRowsToProduct([row])[0]);
        }
      });
    });
  }

  /**
   * Insert the provided product in the database.
   * @param newProduct The new Product object.
   * @returns A Promise that resolve to nothing.
   */
  insertProduct(newProduct: Product) {
    return new Promise((resolve, reject) => {
      const query =
        "INSERT INTO PRODUCTS (sellingPrice, model, category, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?)";

      db.run(
        query,
        [
          newProduct.sellingPrice,
          newProduct.model,
          newProduct.category,
          newProduct.arrivalDate,
          newProduct.details,
          newProduct.quantity,
        ],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(true);
          }
        }
      );
    });
  }

  /**
   * Update an existing product of the provided model in the database with the provided info.
   * @param newProduct The Product object that contains the new info.
   * @param model The unique model of the product.
   * @returns A Promise that resolve to nothing.
   */
  updateProduct(newProduct: Product, model: String) {
    return new Promise((resolve, reject) => {
      const query =
        "UPDATE PRODUCTS SET sellingPrice = ?, category = ?, arrivalDate = ?, details = ?, quantity = ? WHERE model = ?";

      db.run(
        query,
        [
          newProduct.sellingPrice,
          newProduct.category,
          newProduct.arrivalDate,
          newProduct.details,
          newProduct.quantity,
          model,
        ],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(true);
          }
        }
      );
    });
  }

  /**
   * Delete the product in the database corresponding to the provided model.
   * @param model The unique model of the product
   * @returns A Promise that resolve to nothing.
   */
  deleteProductByModel(model: String) {
    return new Promise((resolve, reject) => {
      const query = "DELETE FROM PRODUCTS WHERE model = ?";

      db.run(query, [model], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  }

  /**
   * Delete all products in the database.
   * @returns A Promise that resolve to nothing.
   */
  deleteProducts() {
    return new Promise((resolve, reject) => {
      const query = "DELETE FROM PRODUCTS";

      db.run(query, [], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  }
}

export default ProductDAO;
