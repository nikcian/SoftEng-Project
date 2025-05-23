import { test, expect, jest, describe, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import { app } from "../index";
import CartController from "../src/controllers/cartController";
import Authenticator from "../src/routers/auth";
import { Role, User } from "../src/components/user";
import { Cart, ProductInCart } from "../src/components/cart";
import { Category, Product } from "../src/components/product";
import {
  EmptyProductStockError,
  LowProductStockError,
  ProductNotFoundError,
} from "../src/errors/productError";
import {
  CartNotFoundError,
  EmptyCartError,
  ProductNotInCartError,
  ProductInCartError,
} from "../src/errors/cartError";
import CartDAO from "../src/dao/cartDAO";
import ProductDAO from "../src/dao/productDAO";
import ProductController from "../src/controllers/productController";
import { cleanup } from "../src/db/cleanup";

const baseURLCart = "/ezelectronics/carts";
const baseURLProduct = "/ezelectronics/products";
const baseURLUser = "/ezelectronics/users";
const baseURLSession = "/ezelectronics/sessions";

let testCustomer1: any = {
  username: "customer1-username",
  name: "customer1-name",
  surname: "customer1-surname",
  role: "Customer",
  password: "password",
};
let testCustomer2: any = {
  username: "customer2-username",
  name: "customer2-name",
  surname: "customer2-surname",
  role: "Customer",
  password: "password",
};
let testManager: any = {
  username: "manager-username",
  name: "manager-name",
  surname: "manager-surname",
  role: "Manager",
  password: "password",
};
let testAdmin: any = {
  username: "admin-username",
  name: "admin-name",
  surname: "admin-surname",
  role: "Admin",
  password: "password",
};
let testProduct1: any = {
  model: "P1",
  category: "Smartphone",
  quantity: 5,
  details: "",
  sellingPrice: 200,
  arrivalDate: "2024-01-01",
};
let testProduct2: any = {
  model: "P2",
  category: "Laptop",
  quantity: 5,
  details: "",
  sellingPrice: 200,
  arrivalDate: "2024-01-01",
};
let testProduct3: any = {
  model: "P3",
  category: "Appliance",
  quantity: 1,
  details: "",
  sellingPrice: 200,
  arrivalDate: "2024-01-01",
};
let testCart: any = {
  customer: "customer1-username",
  paid: 0,
  paymentDate: null,
  products: [
    {
      category: "Smartphone",
      model: "P1",
      price: 200,
      quantity: 1,
    },
  ],
  total: 200,
};

let customerCookie1: string;
let customerCookie2: string;
let adminCookie: string;
let managerCookie: string;

const login = async (userInfo: any) => {
  return new Promise<string>((resolve, reject) => {
    request(app)
      .post(baseURLSession)
      .send(userInfo)
      .end((err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res.header["set-cookie"][0]);
        }
      });
  });
};

const addUser = async (userInfo: any) => {
  await request(app).post(baseURLUser).send(userInfo);
};

const addProduct = (productData: any) => {
  return new Promise((resolve, reject) => {
    request(app)
      .post(baseURLProduct)
      .set("Cookie", managerCookie)
      .send(productData)
      .then(() => resolve(undefined))
      .catch((err) => reject(err));
  });
};

const sellProduct = async (model: string, quantity: Number, sellingDate: string | null) => {
  await request(app)
    .patch(baseURLProduct + "/" + model + "/sell")
    .set("Cookie", managerCookie)
    .send({ quantity: quantity, sellingDate: sellingDate });
};

beforeAll(async () => {
  cleanup();

  await addUser(testCustomer1);
  customerCookie1 = await login(testCustomer1);
  await addUser(testCustomer2);
  customerCookie2 = await login(testCustomer2);
  await addUser(testManager);
  managerCookie = await login(testManager);
  await addUser(testAdmin);
  adminCookie = await login(testAdmin);

  await addProduct(testProduct1);
  await addProduct(testProduct2);
  await addProduct(testProduct3);
  await sellProduct(testProduct3.model, testProduct3.quantity, null);
});

afterAll(() => cleanup());

describe("POST /ezelectronics/carts", () => {
  test("Product inserted correctly in cart", async () => {
    const response = await request(app)
      .post(baseURLCart)
      .set("Cookie", customerCookie1)
      .send({ model: testProduct1.model });

    expect(response.status).toBe(200);
  });

  test("Product does not exist", async () => {
    const response = await request(app)
      .post(baseURLCart)
      .set("Cookie", customerCookie1)
      .send({ model: "fake model" });

    expect(response.status).toBe(404);
  });

  test("Product quantity is zero", async () => {
    const response = await request(app)
      .post(baseURLCart)
      .set("Cookie", customerCookie1)
      .send({ model: testProduct3.model });

    expect(response.status).toBe(409);
  });
});

describe("GET /ezelectronics/carts", () => {
  test("Cart retrieved correctly", async () => {
    const response = await request(app).get(baseURLCart).set("Cookie", customerCookie1);

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual(testCart);
  });

  test("Dummy cart generated correctly", async () => {
    const response = await request(app).get(baseURLCart).set("Cookie", customerCookie2);

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      customer: testCustomer2.username,
      paid: false,
      paymentDate: null,
      total: 0,
      products: [],
    });
  });
});

describe("GET /ezelectronics/carts/history", () => {
  test("History carts retrieved correctly", async () => {
    const response = await request(app)
      .get(baseURLCart + "/history")
      .set("Cookie", customerCookie1);

    expect(response.status).toBe(200);
  });
});

describe("GET /ezelectronics/carts/all", () => {
  test("All carts retrieved correctly", async () => {
    const response = await request(app)
      .get(baseURLCart + "/all")
      .set("Cookie", managerCookie);

    expect(response.status).toBe(200);
  });
});

describe("PATCH /ezelectronics/carts", () => {
  test("Cart checkout correct", async () => {
    const response = await request(app).patch(baseURLCart).set("Cookie", customerCookie1);

    expect(response.status).toBe(200);
  });

  test("There is no information about an unpaid cart for the current user", async () => {
    const response = await request(app).patch(baseURLCart).set("Cookie", customerCookie1);

    expect(response.status).toBe(404);
  });

  test("The current cart is empty", async () => {
    const response1 = await request(app).post(baseURLCart).set("Cookie", customerCookie2).send(testProduct1);

    expect(response1.status).toBe(200);

    const response2 = await request(app)
      .delete(baseURLCart + `/products/${testProduct1.model}`)
      .set("Cookie", customerCookie2);

    expect(response2.status).toBe(200);

    const response = await request(app).patch(baseURLCart).set("Cookie", customerCookie2);

    expect(response.status).toBe(400);
  });

  test("At least one product in cart has available quantity lesser than requested quantity", async () => {
    const response1 = await request(app).post(baseURLCart).set("Cookie", customerCookie2).send(testProduct2);
    const response2 = await request(app).post(baseURLCart).set("Cookie", customerCookie2).send(testProduct2);

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);

    await sellProduct(testProduct2.model, testProduct2.quantity - 1, null);

    const response = await request(app).patch(baseURLCart).set("Cookie", customerCookie2);
    expect(response.status).toBe(409);
  });

  test("At least one product in cart has available quantity as zero", async () => {
    const response1 = await request(app).post(baseURLCart).set("Cookie", customerCookie2).send(testProduct2);

    expect(response1.status).toBe(200);

    await sellProduct(testProduct2.model, 1, null);

    const response = await request(app).patch(baseURLCart).set("Cookie", customerCookie2);
    expect(response.status).toBe(409);
  });
});

describe("DELETE /ezelectronics/carts/products/:model", () => {
  test("Product deleted from cart correcly", async () => {
    const response1 = await request(app).post(baseURLCart).set("Cookie", customerCookie1).send(testProduct1);

    expect(response1.status).toBe(200);

    const response2 = await request(app)
      .delete(baseURLCart + `/products/${testProduct1.model}`)
      .set("Cookie", customerCookie1);

    expect(response2.status).toBe(200);
  });

  test("The product is not in cart", async () => {
    const response = await request(app)
      .delete(baseURLCart + `/products/${testProduct2.model}`)
      .set("Cookie", customerCookie1);

    expect(response.status).toBe(404);
  });

  test("The product does not exist", async () => {
    const response = await request(app)
      .delete(baseURLCart + `/products/${"fake model"}`)
      .set("Cookie", customerCookie1);

    expect(response.status).toBe(404);
  });

  test("There is no information about an unpaid cart for the user", async () => {
    const response = await request(app)
      .delete(baseURLCart + `/products/${testProduct1.model}`)
      .set("Cookie", customerCookie2);

    expect(response.status).toBe(404);
  });
});

describe("DELETE /ezelectronics/carts/current", () => {
  test("Current cart deleted correctly", async () => {
    const response1 = await request(app)
      .post(baseURLCart)
      .set("Cookie", customerCookie2)
      .send({ model: testProduct1.model });

    expect(response1.status).toBe(200);

    const response2 = await request(app)
      .delete(baseURLCart + "/current")
      .set("Cookie", customerCookie2);

    expect(response2.status).toBe(200);
  });

  test("There in no information about an unpaid cart for the user", async () => {
    const response = await request(app)
      .delete(baseURLCart + "/current")
      .set("Cookie", customerCookie2);

    expect(response.status).toBe(404);
  });
});

describe("DELETE /ezelectronics/carts", () => {
  test("All carts deleted correctly", async () => {
    const response = await request(app).delete(baseURLCart).set("Cookie", managerCookie);

    expect(response.status).toBe(200);
  });
});
