/**
 * A class that implements the interaction with the database for all cart-related operations.
 */

import { CartNotFoundError, EmptyCartError, ProductNotInCartError } from "../errors/cartError";
import { Cart, ProductInCart } from "../components/cart";
import db from "../db/db";
import { ProductNotFoundError } from "../errors/productError";
import { Utility } from "../utilities";

const mapRowsToCart = (cartRows: any, productRows: any): Cart[] => {
  const carts: Cart[] = [];

  cartRows.forEach((cartRow: any) => {
    let currentCart = new Cart(cartRow.username, cartRow.paid, cartRow.paymentDate, 0, []);

    productRows.forEach((productRow: any) => {
      if (productRow.cartID === cartRow.cartID) {
        currentCart.products.push(
          new ProductInCart(
            productRow.model,
            productRow.quantity,
            productRow.category,
            productRow.sellingPrice
          )
        );

        currentCart.total += productRow.total;
      }
    });

    carts.push(currentCart);
  });

  return carts;
};

class CartDAO {
  /**
   *
   * @returns
   */
  getCarts(): Promise<Cart[]> {
    return new Promise((resolve, reject) => {
      const query =
        "SELECT cartID, username, paid, paymentDate FROM CART C, USERS U WHERE C.userID = U.userID";

      db.all(query, [], (err, cartRows) => {
        if (err) {
          reject(err);
        }

        const query =
          "SELECT cartID, sellingPrice, model, category, CP.quantity, SUM(sellingPrice*CP.quantity) AS total FROM CARTPRODUCTS CP, PRODUCTS P WHERE CP.productID = P.productID GROUP BY cartID, model";

        db.all(query, [], (err, productRows) => {
          if (err) {
            reject(err);
          }

          const carts = mapRowsToCart(cartRows, productRows);

          resolve(carts);
        });
      });
    });
  }

  /**
   *
   * @param username
   * @returns a list of all carts of the given username.
   */
  getUserCarts(username: String): Promise<Cart[]> {
    return new Promise((resolve, reject) => {
      const query =
        "SELECT cartID, username, paid, paymentDate FROM CART C, USERS U WHERE C.userID = U.userID AND username = ?";

      db.all(query, [username], (err, cartRows) => {
        if (err) {
          reject(err);
        }

        const query =
          "SELECT cartID, sellingPrice, model, category, CP.quantity, SUM(sellingPrice*CP.quantity) AS total FROM CARTPRODUCTS CP, PRODUCTS P WHERE CP.productID = P.productID GROUP BY cartID, model";

        db.all(query, [], (err, productRows) => {
          if (err) {
            reject(err);
          }

          const carts = mapRowsToCart(cartRows, productRows);

          resolve(carts);
        });
      });
    });
  }
  /**
   * @param username
   * @returns the user's current cart object. If does not exists, return undefined
   */
  getUserCurrentCart(username: String): Promise<Cart | undefined> {
    return new Promise(async (resolve, reject) => {
      try {
        const userCarts = await this.getUserCarts(username);
        // May be a user who has not purchased anything yet and with empty cart
        if (!userCarts.length) {
          resolve(undefined);
          return;
        }
        const currentCart = userCarts.find((row) => !row.paid); // find() returns undefined if there is no match
        resolve(currentCart);
      } catch (error) {
        reject(error);
      }
    });
  }
  /**
   * @param username
   * @returns a dummy cart object. That is used when a user has its cart empty (does not exists on the database)
   */
  getDummyCart(username: string): Cart {
    return new Cart(username, false, null, 0, []);
  }

  getCurrentCartId(username: String): Promise<Number | undefined> {
    return new Promise((resolve, reject) => {
      const sql =
        "SELECT C.cartID FROM cart AS C, users AS U WHERE C.userID=U.userID AND C.paid=0 AND U.username=?";
      db.get(sql, [username], (err, row: any) => {
        if (err) {
          reject(err);
        } else if (row === undefined) {
          resolve(row);
        } else {
          resolve(row.cartID);
        }
      });
    });
  }

  insertNewProductInCart(cartId: Number, productId: Number, quantity: Number): Promise<Boolean> {
    return new Promise((resolve, reject) => {
      const sql = "INSERT INTO cartProducts (cartID, productID, quantity) VALUES (?,?,?)";
      db.run(sql, [cartId, productId, quantity], function (err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  createNewCart(username: String, productId: Number): Promise<Boolean> {
    return new Promise((resolve, reject) => {
      let sql = "SELECT userID FROM users WHERE username=?";
      db.get(sql, [username], (err, row: any) => {
        if (err) {
          reject(err);
        } else if (row === undefined) {
          resolve(false);
        } else {
          sql = "INSERT INTO cart (userID, paid) VALUES (?, 0)";
          db.run(sql, [row.userID], async (err) => {
            if (err) {
              reject(err);
            } else {
              const cartId = await this.getCurrentCartId(username);
              if (cartId === undefined) {
                resolve(false);
              }
              resolve(await this.insertNewProductInCart(cartId, productId, 1));
            }
          });
        }
      });
    });
  }

  addToUserCart(username: String, model: String): Promise<Boolean> {
    return new Promise((resolve, reject) => {
      let sql = "SELECT productID FROM products WHERE quantity>0 AND model=?";
      db.get(sql, [model], async (errProductId, rowProductId: any) => {
        if (errProductId) {
          reject(errProductId);
        } else if (rowProductId === undefined) {
          resolve(false);
        } else {
          const cartId = await this.getCurrentCartId(username);
          const result = await this.editProductInCartQuantity(cartId, username, model, 1);
          resolve(result);
        }
      });
    });
  }

  checkoutUserCart(username: String) {
    return new Promise((resolve, reject) => {
      let query =
        "SELECT cartID FROM users AS U, cart AS C WHERE U.userID=C.userID AND C.paid=0 AND U.username=?";

      db.get(query, [username], (err, row: any) => {
        if (err) {
          reject(err);
        } else if (row === undefined) {
          resolve({ error: "This user doesn't have a current cart" });
        } else {
          query = "UPDATE cart SET paid=1, paymentDate=? WHERE cartID=?";
          db.run(query, [Utility.now(), row.cartID], function (err) {
            if (err) {
              reject(err);
            } else {
              resolve(this.changes);
            }
          });
        }
      });
    });
  }

  /**
   * @param model model of the product
   * @returns productId
   */
  getProductIdFromModel(model: String): Promise<Number> {
    return new Promise<Number>((resolve, reject) => {
      let sql = "SELECT productID FROM products WHERE model=?";
      db.get(sql, [model], async (errProductId, rowProduct: any) => {
        if (errProductId) {
          reject(errProductId);
          return;
        } else if (rowProduct === undefined) {
          reject(new ProductNotFoundError());
          return;
        }
        resolve(rowProduct.productID);
      });
    });
  }
  /** Update the cartProducts quantity on the database
   * @param cartID
   * @param productId
   * @param updatedQuantity number that will overwrite the previous one stored in the database
   * @returns number of changes (should be 1)
   */
  updateCartProductRecord(cartID: Number, productId: Number, updatedQuantity: Number): Promise<Number> {
    return new Promise<Number>((resolve, reject) => {
      const sql = "UPDATE cartProducts SET quantity = ? WHERE cartID=? AND productID=?";
      db.run(sql, [updatedQuantity, cartID, productId], function (err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.changes);
      });
    });
  }
  /** Delete a cartProduct record on the database (should be called if quantity of the product reaches zero)
   * @param cartID
   * @param productId
   * @returns number of changes (should be 1)
   */
  deleteCartProductRecord(cartID: Number, productId: Number): Promise<Number> {
    return new Promise<Number>((resolve, reject) => {
      const sql = "DELETE FROM cartProducts WHERE cartID=? AND productID=?";
      db.run(sql, [cartID, productId], function (err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.changes);
      });
    });
  }

  /**
   * Fix the quantity of a given product inside the cart
   * @param cartID Cart identifier. Can be undefined, in that case a new unpaid cart will be inserted on the database
   * @param username Owner of the cart
   * @param model Model of the product
   * @param delta Increment to the quantity (such as 1 or -1)
   * @returns A Promise that resolves to `true` if the quantity has been successfully updated
   */
  editProductInCartQuantity(
    cartID: Number,
    username: String,
    model: String,
    delta: number
  ): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        const productId = await this.getProductIdFromModel(model);
        // Get the user current cart Row (not paid yet). Format: {username, paid, paymentDate, total, products: [{model, quantity, category, price}, {productInCart_2}, {productInCart_3}, ...]}
        const cartRow = await this.getUserCurrentCart(username);
        let updatedQuantity; // default value will be 1 for adding a new product to the cart
        let productInCart;

        if (cartRow) {
          productInCart = cartRow.products.find((prod) => prod.model === model); // Extract the product object inside the cart
          // Compute the updated quantity of the product (if already is in the cart)
          updatedQuantity = productInCart ? productInCart.quantity + delta : 1;
        } else {
          //reject(new CartNotFoundError());
        }

        // If the cart does not exists, then insert a new one on the database, and insert the cartProduct record
        if (!cartID) await this.createNewCart(username, productId);
        // If cartProduct record doesn't exists on the database, create a new one
        else if (!productInCart) await this.insertNewProductInCart(cartID, productId, updatedQuantity);
        // if the quantity of the product to remove on the cart is > 0, then update cartProducts record
        else if (Number(updatedQuantity) > 0)
          await this.updateCartProductRecord(cartID, productId, updatedQuantity);
        else {
          await this.deleteCartProductRecord(cartID, productId);
        }

        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Removes one product unit from the current cart (paid==0). In case there is more than one unit in the cart, only one should be removed.
   * @param user The user who owns the cart.
   * @param product The model of the product to remove.
   * @returns A Promise that resolves to `true` if the product was successfully removed.
   */
  removeProductFromCart(username: String, product: String): Promise<Boolean> {
    return new Promise<Boolean>(async (resolve, reject) => {
      try {
        const cartID = await this.getCurrentCartId(username);

        // Check whether the cart exists
        if (!cartID) {
          throw new CartNotFoundError();
        }

        // NOTE: getUserCurrentCart is also called inside editProductInCartQuantity, which is shared by addProductInCart and removeProductFromCart
        // addProductInCart allows to add products that are not inside the cart yet. removeProductFromCart does not allow that, and in such case must return ProductNotInCartError
        const cart = await this.getUserCurrentCart(username);

        if (!cart.products.find((p) => p.model === product)) {
          throw new ProductNotInCartError();
        }

        const result = await this.editProductInCartQuantity(cartID, username, product, -1);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }
  /** This function works as 'Cart empty'
   * @returns A Promise that resolves to `true` if the cart is successfully deleted.
   */
  deleteUserCart(cartID: Number): Promise<Boolean> {
    return new Promise<Boolean>((resolve, reject) => {
      const sql = "DELETE FROM cart WHERE cartID=?";
      db.run(sql, [cartID], function (err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(true);
      });
    });
  }
  /**
   * @returns A Promise that resolves to `true` if all db products are successfully removed.
   */
  deleteAllCarts(): Promise<Boolean> {
    return new Promise<Boolean>((resolve, reject) => {
      const sql = "DELETE FROM cart";
      db.run(sql, [], function (err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(true);
      });
    });
  }
}

export default CartDAO;
