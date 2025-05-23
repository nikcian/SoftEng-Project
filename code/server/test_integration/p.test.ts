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
import db from "../src/db/db";

const baseURLCart = "/ezelectronics/carts";
const baseURLProduct = "/ezelectronics/products";
const baseURLUser = "/ezelectronics/users";
const baseURLSession = "/ezelectronics/sessions";

let testCustomer = {
  username: "customer-username",
  name: "customer-name",
  surname: "customer-surname",
  role: "Customer",
  password: "password",
};
let testManager = {
  username: "manager-username",
  name: "manager-name",
  surname: "manager-surname",
  role: "Manager",
  password: "password",
};
let testAdmin = {
  username: "admin-username",
  name: "admin-name",
  surname: "admin-surname",
  role: "Admin",
  password: "password",
};
let testProduct1 = {
  model: "P1",
  category: "Smartphone",
  quantity: 5,
  details: "",
  sellingPrice: 200,
  arrivalDate: "2024-01-01",
};
let testProduct2 = {
  model: "P2",
  category: "Laptop",
  quantity: 5,
  details: "",
  sellingPrice: 200,
  arrivalDate: "2024-01-01",
};
let testProduct3 = {
  model: "P3",
  category: "Appliance",
  quantity: 5,
  details: "",
  sellingPrice: 200,
  arrivalDate: "2024-01-01",
};

let customerCookie: string;
let adminCookie: string;
let managerCookie: string;
let AdminOrManagerCookie: string;

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


const addProductTest = async (sellingPrice: number, model:string, category:string, arrivalDate:string, details:string, quantity:number) =>{ return new Promise((resolve, reject) => {
  const query =
    "INSERT INTO PRODUCTS (sellingPrice, model, category, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?)";

  db.run(
    query,[sellingPrice, model, category, arrivalDate, details, quantity],function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    }
  );
});
}
const inputProduct = { sellingPrice: 57.00, model: "P4", category: Category.LAPTOP, arrivalDate: "2024-01-01", details: "test", quantity: 0 }
beforeAll(async () => {
  await cleanup();

  await addUser(testCustomer);
  customerCookie = await login(testCustomer);
  await addUser(testManager);
  managerCookie = await login(testManager);
  await addUser(testAdmin);
  adminCookie = await login(testAdmin);

  
  await addProduct(testProduct2);
  await addProduct(testProduct3);
  await addProductTest(inputProduct.sellingPrice, inputProduct.model, inputProduct.category, inputProduct.arrivalDate, inputProduct.details, inputProduct.quantity);

});

afterAll(async() => {
  await cleanup();
});


describe("POST /products", () => {
    test("Product inserted correctly ", async () => {
      const response = await request(app)
        .post(baseURLProduct)
        .set("Cookie", managerCookie)
        .send(testProduct1);
  
      expect(response.status).toBe(200);
    });

  
    test("It should return a 409 error code for model existing", async () => {
      const inputProduct2 = { sellingPrice: 57.00, model: "P2", category: Category.LAPTOP, arrivalDate: "2023-01-01", details: "test", quantity: 15 }            

      const response = await request(app).post(baseURLProduct).set("Cookie", managerCookie).send(inputProduct2);
      expect(response.status).toBe(409);
  });
 

    test("Product not inserted 400 error code when the arrivalDate is after current date ", async () => {
      const inputProduct = { sellingPrice: 57.00, model: "provaerrore400", category: Category.LAPTOP, arrivalDate: "2075-01-01", details: "test", quantity: 15 }
      const response = await request(app)
        .post(baseURLProduct)
        .set("Cookie", managerCookie)
        .send(inputProduct);
        expect(response.status).toBe(400);
      
    });
});

describe("PATCH /products/:model", ()=>{
    test("It should return a 200 success code", async()=>{
      const inputProduct = { model: "P2", quantity: 15, arrivalDate: "2024-02-01" }
      const inputProduct2 = { sellingPrice: 57.00, model: "P2", category: Category.LAPTOP, arrivalDate: "2023-01-01", details: "test", quantity: 15 }            
      const newinputProduct={quantity: 15, changeDate: "2024-02-01"};
      const response = await request(app).patch(baseURLProduct + `/${inputProduct.model}`).set("Cookie", managerCookie).send(newinputProduct);

      expect(response.status).toBe(200)      
    })

    test("It should return a 400 error code when the changeDate is after current date", async () => {
      const inputProduct = { sellingPrice: 57.00, model: "P2", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 15 }
      const newinputProduct={quantity: 15, changeDate: "2073-02-01"};
      const response = await request(app).patch(baseURLProduct + `/${inputProduct.model}`).set("Cookie", managerCookie).send(newinputProduct)
      expect(response.status).toBe(400);
  });

  test("It should return a 400 error code when the changeDate is before current date", async () => {
    const inputProduct = { sellingPrice: 57.00, model: "P2", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 15 }
    
    const newinputProduct={quantity: 15, changeDate: "1905-02-01"};
    const response = await request(app).patch(baseURLProduct + `/${inputProduct.model}`).set("Cookie", managerCookie).send(newinputProduct)
    expect(response.status).toBe(400);
  });

  test("It should return a 404 error code when product not found", async () => {
    const inputProduct = { sellingPrice: 57.00, model: "provaerrore404", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 15 }
    const newinputProduct={quantity: 15, changeDate: "2023-02-01"};
    const response = await request(app).patch(baseURLProduct + `/errore404`).set("Cookie", managerCookie).send(newinputProduct)
    expect(response.status).toBe(404);
    
  });

});


describe("PATCH /products/:model/sell", ()=>{
  test("It should return a 200 success code", async()=>{
      const inputProduct = { model: "P2", quantity: 5, sellingDate: "2024-05-01" }
      const newinputProduct={quantity: 5, sellingDate: "2024-05-01"};
      const response = await request(app).patch(baseURLProduct + `/${inputProduct.model}/sell`).set("Cookie", managerCookie).send(newinputProduct);
      expect(response.status).toBe(200);
  });

  test("It should return a 404 error code when product not found", async () => {
      const inputProduct = { sellingPrice: 57.00, model: "provaerrore404", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 15 }
      const newinputProduct={quantity: 5, sellingDate: "2023-02-01"};
      const response = await request(app).patch(baseURLProduct + `/errore404/sell`).set("Cookie",managerCookie).send(newinputProduct)
      expect(response.status).toBe(404);
  });

  test("It should return a 400 error code when the sellingDate is after current date", async () => {
      const inputProduct = { sellingPrice: 57.00, model: "P2", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 15 }
      const newinputProduct={quantity: 15, sellingDate: "2073-02-01"};
      const response = await request(app).patch(baseURLProduct + `/${inputProduct.model}/sell`).set("Cookie",managerCookie).send(newinputProduct)
      expect(response.status).toBe(400);
  });
  

  test("It should return a 400 error code when the selling Date is before current date", async () => {
      const inputProduct = { sellingPrice: 57.00, model: "P2", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 15 }
      const newinputProduct={quantity: 15, sellingDate: "1905-02-01"};
      const response = await request(app).patch(baseURLProduct + `/${inputProduct.model}/sell`).set("Cookie",managerCookie).send(newinputProduct)
      expect(response.status).toBe(400);
      
  });

  test("It should return a 409 error code when quantity=0", async () => {
     
      const inputProduct={model:"P4"}
      
      const newinputProduct={quantity: 15, sellingDate: "2024-02-01"};
      const response = await request(app).patch(baseURLProduct + `/${inputProduct.model}/sell`).set("Cookie",managerCookie).send(newinputProduct)
      expect(response.status).toBe(409);
 });


  test("It should return a 409 error code when quantity not sufficient", async () => {
      const inputProduct = { sellingPrice: 57.00, model: "P2", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 10 }
      const newinputProduct={quantity: 150, sellingDate: "2024-05-01"};
      const response = await request(app).patch(baseURLProduct + `/${inputProduct.model}/sell`).set("Cookie",managerCookie).send(newinputProduct)
      expect(response.status).toBe(409);
      
  });
});


describe("GET /products", ()=>{
 
  test("It should return a 200 success get all Products", async () => {
      const inputProduct = [{ sellingPrice: 57.00, model: "P2", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 10 }]
      const inputChoice={grouping: "model", category: "", model:"P2"}
      const response = await request(app).get(baseURLProduct + `?grouping=${inputChoice.grouping}&model=${inputChoice.model}`).set("Cookie",adminCookie);  //da cambiare in admin e manager
      expect(response.status).toBe(200)
  });


  test("It should return a 422 error code when grouping null but category and model no", async () => {
      const inputProduct = [{ sellingPrice: 57.00, model: "provasuccesso", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 10 }]
      const inputChoice={grouping: "", category: Category.LAPTOP, model:"provasuccesso"}
      const response = await request(app).get(baseURLProduct + `?grouping=${inputChoice.grouping}&category=${inputChoice.category}&model=${inputChoice.model}`).set("Cookie",adminCookie);  //da cambiare in admin e manager
      expect(response.status).toBe(422);
  });

  test("It should return a 422 error code when grouping=category and category is null and model is not null", async () => {
      const inputProduct = [{ sellingPrice: 57.00, model: "prova422", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 10 }]
      const inputChoice={grouping: "category", category: "", model:"prova422"}
      const response = await request(app).get(baseURLProduct + `?grouping=${inputChoice.grouping}&category=${inputChoice.category}&model=${inputChoice.model}`).set("Cookie",adminCookie);  //da cambiare in admin e manager
      expect(response.status).toBe(422);
    });


  test("It should return a 422 error code when grouping=model, model=null and category is not null", async () => {
      const inputProduct = [{ sellingPrice: 57.00, model: "prova422", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 10 }]
      const inputChoice={grouping: "model", category: Category.LAPTOP, model:""}
      const response = await request(app).get(baseURLProduct + `?grouping=${inputChoice.grouping}&category=${inputChoice.category}&model=${inputChoice.model}`).set("Cookie",adminCookie);  //da cambiare in admin e manager
      expect(response.status).toBe(422);
  });

  test("It should return a 404 error code model not existing", async () => {
      const inputProduct = [{ sellingPrice: 57.00, model: "prova404", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 10 }]
      const inputChoice={grouping: "model", category: "", model:"prova404"}
      const response = await request(app).get(baseURLProduct + `?grouping=${inputChoice.grouping}&model=${inputChoice.model}`).set("Cookie",adminCookie);  //da cambiare in admin e manager
      expect(response.status).toBe(404);
  });
});


describe("GET /products/available", ()=>{
  
  test("It should return a 200 success get all Products", async () => {
      const inputProduct = [{ sellingPrice: 57.00, model: "P2", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 10 }]
      const inputChoice={grouping: "model", category: "", model:"P2"}
      const response = await request(app).get(baseURLProduct + `/available?grouping=${inputChoice.grouping}&model=${inputChoice.model}`).set("Cookie",customerCookie); //aggiustare la condizione è isLogged in
      expect(response.status).toBe(200)
  });


  test("It should return a 422 error code when grouping null but category and model no", async () => {
      const inputProduct = [{ sellingPrice: 57.00, model: "prova422", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 10 }]
      const inputChoice={grouping: "", category: Category.LAPTOP, model:"prova422"}
      const response = await request(app).get(baseURLProduct + `/available?grouping=${inputChoice.grouping}&category=${inputChoice.category}&model=${inputChoice.model}`).set("Cookie",customerCookie); //aggiustare la condizione è isLogged in
      expect(response.status).toBe(422);
      
  });

  test("It should return a 422 error code when grouping=category and category is null and model is not null", async () => {
      const inputProduct = [{ sellingPrice: 57.00, model: "prova422", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 10 }]
      const inputChoice={grouping: "category", category: "", model:"prova422"}
      const response = await request(app).get(baseURLProduct + `/available?grouping=${inputChoice.grouping}&category=${inputChoice.category}&model=${inputChoice.model}`).set("Cookie",customerCookie); //aggiustare la condizione è isLogged in
      expect(response.status).toBe(422);
        });


  test("It should return a 422 error code when grouping=model, model=null and category is not null", async () => {
      const inputProduct = [{ sellingPrice: 57.00, model: "prova422", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 10 }]
      const inputChoice={grouping: "model", category: Category.LAPTOP, model:""}
      const response = await request(app).get(baseURLProduct + `/available?grouping=${inputChoice.grouping}&category=${inputChoice.category}&model=${inputChoice.model}`).set("Cookie",customerCookie); //aggiustare la condizione è isLogged in
      expect(response.status).toBe(422);
  });

  test("It should return a 404 error code model not existing", async () => {
      const inputProduct = [{ sellingPrice: 57.00, model: "prova404", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 10 }]
      const inputChoice={grouping: "model", category: "", model:"prova404"}
      const response = await request(app).get(baseURLProduct + `/available?grouping=${inputChoice.grouping}&model=${inputChoice.model}`).set("Cookie",customerCookie); //aggiustare la condizione è isLogged in
      expect(response.status).toBe(404);
  });
});

describe("DELETE /products/:model", ()=>{
 test("It should return a 200 success deleted product", async () => {
      const inputProduct = [{ sellingPrice: 57.00, model: "P3", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 10 }];
      const inputChoice={model:"P3"}
      const response = await request(app).delete(baseURLProduct + `/${inputChoice.model}`).set("Cookie", adminCookie);    //aggiustare in sAdminOrManager
      expect(response.status).toBe(200)
  });

  test("It should return a 404 error code model not existing", async () => {
      const inputProduct = [{ sellingPrice: 57.00, model: "prova404", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 10 }]
      const inputChoice={model:"provaerrore404"}
      const response = await request(app).delete(baseURLProduct + `/${inputChoice.model}`).set("Cookie", adminCookie);    //aggiustare in sAdminOrManager
      expect(response.status).toBe(404);
  });

})



describe("DELETE /products", ()=>{

  test("It should return a 200 success delete Products", async () => {
      const inputProduct = [{ sellingPrice: 57.00, model: "provasuccesso", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 10 },
          { sellingPrice: 77.00, model: "provasuccesso2", category: Category.APPLIANCE, arrivalDate: "2018-01-01", details: "test", quantity: 20 }
      ];
      const response = await request(app).delete(baseURLProduct).set("Cookie",adminCookie); //aggiustare in admin o manager
      expect(response.status).toBe(200)       
  })

});