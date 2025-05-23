import { test, expect, jest, describe, beforeAll, beforeEach, afterEach } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"
import { DateError } from "../../src/utilities"
import ProductController from "../../src/controllers/productController"
import Authenticator from "../../src/routers/auth"
import { Role, User } from "../../src/components/user"
import ErrorHandler from "../../src/helper"
import { Category, Product } from "../../src/components/product"
import {  EmptyProductStockError, LowProductStockError, ProductAlreadyExistsError, ProductNotFoundError } from "../../src/errors/productError"
import ProductRoutes from "../../src/routers/productRoutes"
import { isStringObject } from "util/types"
import { exists } from "fs"
import { param } from "express-validator"
const baseURL = "/ezelectronics"

jest.mock("../../src/controllers/productController");
jest.mock("../../src/routers/auth");


let testAdmin = new User("admin", "admin", "admin", Role.ADMIN, "", "")
let testCustomer = new User("customer", "customer", "customer", Role.CUSTOMER, "", "")
let testProduct= new Product(83.00, "testRoute",Category.LAPTOP, "2023-07-07", "testroute",10);

describe("Route unit tests", ()=>{
   describe("POST /products", ()=>{
    beforeEach(() => {
        jest.clearAllMocks(); // Ripristina tutti i mock prima di ogni test
    });

    afterEach(() => {
        jest.resetAllMocks(); // Ripristina tutti i mock dopo ogni test
        jest.restoreAllMocks(); // Ripristina i mock originali dopo ogni test
    });
        test("It should return a 200 success code", async()=>{
            const inputProduct = { sellingPrice: 57.00, model: "provasuccesso", category: Category.LAPTOP, arrivalDate: "2023-01-01", details: "test", quantity: 15 }            
            jest.mock('express-validator',()=>({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                    isInt: ()=>({ isLength:()=>({})}),
                    isFloat: ()=>({ isLength:()=>({})}),
                    isISO8601: ()=>({ isLength:()=>({})}),
                    notEmpty: ()=>({ isLength:()=>({})}),
                    optional: ()=>({ isLength:()=>({})}),
                })),
            }))
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next() );
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {return next()});

            jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce();
            const response = await request(app).post(baseURL + "/products").send(inputProduct)
          
            expect(response.status).toBe(200)
            expect(ProductController.prototype.registerProducts).toHaveBeenCalled()
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith(inputProduct.model, inputProduct.category, inputProduct.quantity, inputProduct.details, inputProduct.sellingPrice, inputProduct.arrivalDate);        
        });
        
                // Caso di errore di validazione
        test("It should return a 409 error code for model existing", async () => {
            const inputProduct2 = { sellingPrice: 57.00, model: "provasuccesso", category: Category.LAPTOP, arrivalDate: "2023-01-01", details: "test", quantity: 15 }            

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() =>({
                    isString: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                    isInt: ()=>({ isLength:()=>({})}),
                    isFloat: ()=>({ isLength:()=>({})}),
                    isISO8601: ()=>({ isLength:()=>({})}),
                    notEmpty: ()=>({ isLength:()=>({})}),
                    optional: ()=>({ isLength:()=>({})}),
                })),
            }))
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                const errors = [{ msg: 'ProductAlreadyExist' }];
                return res.status(409).json({ errors });
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {return next()});

            jest.spyOn(ProductController.prototype, "registerProducts").mockRejectedValueOnce(new ProductAlreadyExistsError());
            const response = await request(app).post(baseURL + "/products").send(inputProduct2);
            expect(response.status).toBe(409);
            expect(ProductController.prototype.registerProducts).toBeCalledTimes(1);
        });

        test("It should return a 400 error code when the arrivalDate is after current date", async () => {
            const inputProduct = { sellingPrice: 57.00, model: "provaerrore400", category: Category.LAPTOP, arrivalDate: "2075-01-01", details: "test", quantity: 15 }
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                    isInt: ()=>({ isLength:()=>({})}),
                    isFloat: ()=>({ isLength:()=>({})}),
                    isISO8601: ()=>({ isLength:()=>({})}),
                    notEmpty: ()=>({ isLength:()=>({})}),
                    optional: ()=>({ isLength:()=>({})}),
                })),
            }));

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                const errors = [{ msg: 'data error' }];
                return res.status(400).json({ errors });
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {return next()});

            jest.spyOn(ProductController.prototype, "registerProducts").mockRejectedValueOnce(new DateError());
            const response = await request(app).post(baseURL + "/products").send(inputProduct);
            expect(response.status).toBe(400);
            expect(ProductController.prototype.registerProducts).toBeCalledTimes(1);
        });
   });
   
   describe("PATCH /products/:model", ()=>{
    beforeEach(() => {
        jest.clearAllMocks(); // Ripristina tutti i mock prima di ogni test
    });

    afterEach(() => {
        jest.resetAllMocks(); // Ripristina tutti i mock dopo ogni test
        jest.restoreAllMocks(); // Ripristina i mock originali dopo ogni test
    });
        test("It should return a 200 success code", async()=>{
            const inputProduct = { model: "provasuccesso", quantity: 15, arrivalDate: "2023-02-01" }
            const inputProduct2 = { sellingPrice: 57.00, model: "provasuccesso", category: Category.LAPTOP, arrivalDate: "2023-01-01", details: "test", quantity: 15 }            
           
            jest.mock('express-validator',()=>({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    notEmpty: ()=>({ isLength:()=>({})}),
                })),
                body: jest.fn().mockImplementation(() => ({
                    
                    isIn: () => ({ isLength: () => ({}) }),
                    isInt: ()=>({ isLength:()=>({})}),
                    isFloat: ()=>({ isLength:()=>({})}),
                    isISO8601: ()=>({ isLength:()=>({})}),
                    
                })),
            }))
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next() );
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {return next()});
            const newinputProduct={quantity: 15, changeDate: "2023-02-01"};
            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(inputProduct.quantity+inputProduct2.quantity);
            const response = await request(app).patch(baseURL + `/products/${inputProduct.model}`).send(newinputProduct);
            expect(response.status).toBe(200)
            expect(ProductController.prototype.changeProductQuantity).toBeCalledTimes(1)
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith(inputProduct.model, newinputProduct.quantity, newinputProduct.changeDate);        
        });
   

        test("It should return a 400 error code when the changeDate is after current date", async () => {
            const inputProduct = { sellingPrice: 57.00, model: "provaerrore400", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 15 }
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    notEmpty: ()=>({ isLength:()=>({})}),
                })),
                body: jest.fn().mockImplementation(() => ({
                    
                    isIn: () => ({ isLength: () => ({}) }),
                    isInt: ()=>({ isLength:()=>({})}),
                    isFloat: ()=>({ isLength:()=>({})}),
                    isISO8601: ()=>({ isLength:()=>({})}),
                    
                })),
            }));
            const newinputProduct={quantity: 15, changeDate: "2073-02-01"};
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                const errors = [{ msg: 'data error' }];
                return res.status(400).json({ errors });
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {return next()});
            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValueOnce(new DateError());
            const response = await request(app).patch(baseURL + `/products/${inputProduct.model}`).send(newinputProduct)
       //     console.log("Response Status:", response.status);
         //   console.log("Response Body:", response.body);
           // console.log("Input Product:", inputProduct);
            expect(response.status).toBe(400);
            expect(ProductController.prototype.changeProductQuantity).toBeCalledTimes(1);
        });
        

        test("It should return a 400 error code when the changeDate is before current date", async () => {
            const inputProduct = { sellingPrice: 57.00, model: "provaerrore400", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 15 }
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    notEmpty: ()=>({ isLength:()=>({})}),
                })),
                body: jest.fn().mockImplementation(() => ({
                    
                    isIn: () => ({ isLength: () => ({}) }),
                    isInt: ()=>({ isLength:()=>({})}),
                    isFloat: ()=>({ isLength:()=>({})}),
                    isISO8601: ()=>({ isLength:()=>({})}),
                    
                })),
            }));
            const newinputProduct={quantity: 15, changeDate: "1905-02-01"};
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                const errors = [{ msg: 'data error' }];
                return res.status(400).json({ errors });
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {return next()});
            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValueOnce(new DateError());
            const response = await request(app).patch(baseURL + `/products/${inputProduct.model}`).send(newinputProduct)
            expect(response.status).toBe(400);
            expect(ProductController.prototype.changeProductQuantity).toBeCalledTimes(1);
        });
        
        
        test("It should return a 404 error code when product not found", async () => {
            const inputProduct = { sellingPrice: 57.00, model: "provaerrore404", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 15 }
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    notEmpty: ()=>({ isLength:()=>({})}),
                })),
                body: jest.fn().mockImplementation(() => ({
                    
                    isIn: () => ({ isLength: () => ({}) }),
                    isInt: ()=>({ isLength:()=>({})}),
                    isFloat: ()=>({ isLength:()=>({})}),
                    isISO8601: ()=>({ isLength:()=>({})}),
                    
                })),
            }));
            const newinputProduct={quantity: 15, changeDate: "2023-02-01"};
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                const errors = [{ msg: 'product not found' }];
                return res.status(404).json({ errors });
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {return next()});
            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValueOnce(new ProductNotFoundError());
            const response = await request(app).patch(baseURL + `/products/errore404`).send(newinputProduct)
            expect(response.status).toBe(404);
            expect(ProductController.prototype.changeProductQuantity).toBeCalledTimes(1);
        });
    })

    describe("PATCH /products/:model/sell", ()=>{
        beforeEach(() => {
            jest.clearAllMocks(); // Ripristina tutti i mock prima di ogni test
        });
    
        afterEach(() => {
            jest.resetAllMocks(); // Ripristina tutti i mock dopo ogni test
            jest.restoreAllMocks(); // Ripristina i mock originali dopo ogni test
        });
            
        test("It should return a 200 success code", async()=>{
            const inputProduct = { model: "provasuccesso", quantity: 5, sellingDate: "2023-02-01" }
            const inputProduct2 = { sellingPrice: 57.00, model: "provasuccesso", category: Category.LAPTOP, arrivalDate: "2023-01-01", details: "test", quantity: 15 }            
            
            jest.mock('express-validator',()=>({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    notEmpty: ()=>({ isLength:()=>({})}),
                })),
                body: jest.fn().mockImplementation(() => ({
                    
                    isIn: () => ({ isLength: () => ({}) }),
                    isInt: ()=>({ isLength:()=>({})}),
                    isFloat: ()=>({ isLength:()=>({})}),
                    isISO8601: ()=>({ isLength:()=>({})}),
                    
                })),
            }))
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next() );
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {return next()});
            const newinputProduct={quantity: 5, sellingDate: "2023-02-01"};
            jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(inputProduct2.quantity-inputProduct.quantity);
            const response = await request(app).patch(baseURL + `/products/${inputProduct.model}/sell`).send(newinputProduct);
            expect(response.status).toBe(200)
            expect(ProductController.prototype.sellProduct).toBeCalledTimes(1)
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith(inputProduct.model, newinputProduct.quantity, newinputProduct.sellingDate);        
        });

        test("It should return a 404 error code when product not found", async () => {
            const inputProduct = { sellingPrice: 57.00, model: "provaerrore404", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 15 }
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    notEmpty: ()=>({ isLength:()=>({})}),
                })),
                body: jest.fn().mockImplementation(() => ({
                    
                    isIn: () => ({ isLength: () => ({}) }),
                    isInt: ()=>({ isLength:()=>({})}),
                    isFloat: ()=>({ isLength:()=>({})}),
                    isISO8601: ()=>({ isLength:()=>({})}),
                    
                })),
            }));
            const newinputProduct={quantity: 5, sellingDate: "2023-02-01"};
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                const errors = [{ msg: 'product not found' }];
                return res.status(404).json({ errors });
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {return next()});
            jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(new ProductNotFoundError());
            const response = await request(app).patch(baseURL + `/products/errore404/sell`).send(newinputProduct)
        /*    console.log("Response Status:", response.status);
            console.log("Response Body:", response.body);
            console.log("Input Product:", inputProduct);*/
            expect(response.status).toBe(404);
            expect(ProductController.prototype.sellProduct).toBeCalledTimes(1);
        });
        test("It should return a 400 error code when the sellingDate is after current date", async () => {
            const inputProduct = { sellingPrice: 57.00, model: "provaerrore400", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 15 }
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    notEmpty: ()=>({ isLength:()=>({})}),
                })),
                body: jest.fn().mockImplementation(() => ({
                    
                    isIn: () => ({ isLength: () => ({}) }),
                    isInt: ()=>({ isLength:()=>({})}),
                    isFloat: ()=>({ isLength:()=>({})}),
                    isISO8601: ()=>({ isLength:()=>({})}),
                    
                })),
            }));
            const newinputProduct={quantity: 15, sellingDate: "2073-02-01"};
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                const errors = [{ msg: 'data error' }];
                return res.status(400).json({ errors });
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {return next()});
            jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(new DateError());
            const response = await request(app).patch(baseURL + `/products/${inputProduct.model}/sell`).send(newinputProduct)
       //     console.log("Response Status:", response.status);
         //   console.log("Response Body:", response.body);
           // console.log("Input Product:", inputProduct);
            expect(response.status).toBe(400);
            expect(ProductController.prototype.sellProduct).toBeCalledTimes(1);
        });
        

        test("It should return a 400 error code when the selling Date is before current date", async () => {
            const inputProduct = { sellingPrice: 57.00, model: "provaerrore400", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 15 }
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    notEmpty: ()=>({ isLength:()=>({})}),
                })),
                body: jest.fn().mockImplementation(() => ({
                    
                    isIn: () => ({ isLength: () => ({}) }),
                    isInt: ()=>({ isLength:()=>({})}),
                    isFloat: ()=>({ isLength:()=>({})}),
                    isISO8601: ()=>({ isLength:()=>({})}),
                    
                })),
            }));
            const newinputProduct={quantity: 15, sellingDate: "1905-02-01"};
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                const errors = [{ msg: 'data error' }];
                return res.status(400).json({ errors });
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {return next()});
            jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(new DateError());
            const response = await request(app).patch(baseURL + `/products/${inputProduct.model}/sell`).send(newinputProduct)
            expect(response.status).toBe(400);
            expect(ProductController.prototype.sellProduct).toBeCalledTimes(1);
        });

        test("It should return a 409 error code when quantity=0", async () => {
            const inputProduct = { sellingPrice: 57.00, model: "provaerrore409", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 0 }
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    notEmpty: ()=>({ isLength:()=>({})}),
                })),
                body: jest.fn().mockImplementation(() => ({
                    
                    isIn: () => ({ isLength: () => ({}) }),
                    isInt: ()=>({ isLength:()=>({})}),
                    isFloat: ()=>({ isLength:()=>({})}),
                    isISO8601: ()=>({ isLength:()=>({})}),
                    
                })),
            }));
            const newinputProduct={quantity: 15, sellingDate: "2023-02-01"};
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                const errors = [{ msg: 'product sold out' }];
                return res.status(409).json({ errors });
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {return next()});
            jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(new EmptyProductStockError());
            const response = await request(app).patch(baseURL + `/products/${inputProduct.model}/sell`).send(newinputProduct)
            expect(response.status).toBe(409);
            expect(ProductController.prototype.sellProduct).toBeCalledTimes(1);
        });


        test("It should return a 409 error code when quantity not sufficient", async () => {
            const inputProduct = { sellingPrice: 57.00, model: "provaerrore409", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 10 }
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    notEmpty: ()=>({ isLength:()=>({})}),
                })),
                body: jest.fn().mockImplementation(() => ({
                    
                    isIn: () => ({ isLength: () => ({}) }),
                    isInt: ()=>({ isLength:()=>({})}),
                    isFloat: ()=>({ isLength:()=>({})}),
                    isISO8601: ()=>({ isLength:()=>({})}),
                    
                })),
            }));
            const newinputProduct={quantity: 15, sellingDate: "2023-02-01"};
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                const errors = [{ msg: 'product sold out' }];
                return res.status(409).json({ errors });
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {return next()});
            jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(new LowProductStockError());
            const response = await request(app).patch(baseURL + `/products/${inputProduct.model}/sell`).send(newinputProduct)
            expect(response.status).toBe(409);
            expect(ProductController.prototype.sellProduct).toBeCalledTimes(1);
        });
    });

    describe("GET /products", ()=>{
        beforeEach(() => {
            jest.clearAllMocks(); // Ripristina tutti i mock prima di ogni test
        });

        afterEach(() => {
            jest.resetAllMocks(); // Ripristina tutti i mock dopo ogni test
            jest.restoreAllMocks(); // Ripristina i mock originali dopo ogni test
        });

        test("It should return a 200 success get all Products", async () => {
            const inputProduct = [{ sellingPrice: 57.00, model: "provasuccesso", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 10 }]
            jest.mock('express-validator', () => ({
                query: jest.fn().mockImplementation(() => ({
                    equals: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                    not: ()=>({ isLength:()=>({})}),
                    exists: ()=>({ isLength:()=>({})}),
                    isString: ()=>({ isLength:()=>({})}),
                    notEmpty: ()=>({ isLength:()=>({})}),
                    oneOf: ()=>({ isLength:()=>({})}),
                    values: ()=>({ isLength:()=>({})}),
                })),
            }));
            const inputChoice={grouping: "model", model:"provasuccesso"}
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next() );
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {return next()});
            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce(inputProduct);
            const response = await request(app).get(baseURL + `/products?grouping=${inputChoice.grouping}&model=${inputChoice.model}`);
            expect(response.status).toBe(200)
            expect(response.body).toEqual(inputProduct);
            expect(ProductController.prototype.getProducts).toBeCalledTimes(1)
            expect(ProductController.prototype.getProducts).toHaveBeenCalledWith(inputChoice.grouping, undefined, inputChoice.model);        

        });


        test("It should return a 422 error code when grouping null but category and model no", async () => {
            const inputProduct = [{ sellingPrice: 57.00, model: "provasuccesso", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 10 }]
            jest.mock('express-validator', () => ({
                query: jest.fn().mockImplementation(() => ({
                    equals: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                    not: ()=>({ isLength:()=>({})}),
                    exists: ()=>({ isLength:()=>({})}),
                    oneOf: ()=>({ isLength:()=>({})}),
                    isString: ()=>({ isLength:()=>({})}),
                    notEmpty: ()=>({ isLength:()=>({})}),
                    values: ()=>({ isLength:()=>({})}),
                })),
            }));
            const inputChoice={grouping: "", category: Category.LAPTOP, model:"provasuccesso"}
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                const errors = [{ msg: 'invalid input' }];
                return res.status(422).json({ errors });
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {return next()});
            jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValueOnce(new Error("errore parametri"));
            const response = await request(app).get(baseURL + `/products?grouping=${inputChoice.grouping}&category=${inputChoice.category}&model=${inputChoice.model}`);
            expect(response.status).toBe(422);
            expect(ProductController.prototype.getProducts).toBeCalledTimes(0);
        });
    
        test("It should return a 422 error code when grouping=category and category is null and model is not null", async () => {
            const inputProduct = [{ sellingPrice: 57.00, model: "prova422", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 10 }]
            jest.mock('express-validator', () => ({
                query: jest.fn().mockImplementation(() => ({
                    equals: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                    not: ()=>({ isLength:()=>({})}),
                    oneOf: ()=>({ isLength:()=>({})}),
                    exists: ()=>({ isLength:()=>({})}),
                    isString: ()=>({ isLength:()=>({})}),
                    notEmpty: ()=>({ isLength:()=>({})}),
                    values: ()=>({ isLength:()=>({})}),
                })),
            }));
            const inputChoice={grouping: "category", category: "", model:"prova422"}
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                const errors = [{ msg: 'invalid input' }];
                return res.status(422).json({ errors });
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {return next()});
            jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValueOnce(new Error("errore parametri"));
            const response = await request(app).get(baseURL + `/products?grouping=${inputChoice.grouping}&category=${inputChoice.category}&model=${inputChoice.model}`);
            expect(response.status).toBe(422);
            expect(ProductController.prototype.getProducts).toBeCalledTimes(0);
        });


        test("It should return a 422 error code when grouping=model, model=null and category is not null", async () => {
            const inputProduct = [{ sellingPrice: 57.00, model: "prova422", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 10 }]
            jest.mock('express-validator', () => ({
                query: jest.fn().mockImplementation(() => ({
                    equals: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                    not: ()=>({ isLength:()=>({})}),
                    exists: ()=>({ isLength:()=>({})}),
                    isString: ()=>({ isLength:()=>({})}),
                    notEmpty: ()=>({ isLength:()=>({})}),
                    oneOf: ()=>({ isLength:()=>({})}),
                    values: ()=>({ isLength:()=>({})}),
                })),
            }));
            const inputChoice={grouping: "model", category: Category.LAPTOP, model:""}
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                const errors = [{ msg: 'invalid input' }];
                return res.status(422).json({ errors });
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {return next()});
            jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValueOnce(new Error("errore parametri"));
            const response = await request(app).get(baseURL + `/products?grouping=${inputChoice.grouping}&category=${inputChoice.category}&model=${inputChoice.model}`);
            expect(response.status).toBe(422);
            expect(ProductController.prototype.getProducts).toBeCalledTimes(0);
        });

        test("It should return a 404 error code model not existing", async () => {
            const inputProduct = [{ sellingPrice: 57.00, model: "prova404", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 10 }]
            jest.mock('express-validator', () => ({
                query: jest.fn().mockImplementation(() => ({
                    equals: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                    not: ()=>({ isLength:()=>({})}),
                    exists: ()=>({ isLength:()=>({})}),
                    isString: ()=>({ isLength:()=>({})}),
                    notEmpty: ()=>({ isLength:()=>({})}),
                    oneOf: ()=>({ isLength:()=>({})}),
                    values: ()=>({ isLength:()=>({})}),
                })),
            }));
            const inputChoice={grouping: "model", model:"prova404"}
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                const errors = [{ msg: 'invalid input' }];
                return res.status(404).json({ errors });
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {return next()});
            jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValueOnce(new ProductNotFoundError());
            const response = await request(app).get(baseURL + `/products?grouping=${inputChoice.grouping}&model=${inputChoice.model}`);
            expect(response.status).toBe(404);
            expect(ProductController.prototype.getProducts).toBeCalledTimes(1);
        });
    });







    describe("GET /products/available", ()=>{
        beforeEach(() => {
            jest.clearAllMocks(); // Ripristina tutti i mock prima di ogni test
        });

        afterEach(() => {
            jest.resetAllMocks(); // Ripristina tutti i mock dopo ogni test
            jest.restoreAllMocks(); // Ripristina i mock originali dopo ogni test
        });

        test("It should return a 200 success get all Products", async () => {
            const inputProduct = [{ sellingPrice: 57.00, model: "provasuccesso", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 10 }]
            jest.mock('express-validator', () => ({
                query: jest.fn().mockImplementation(() => ({
                    equals: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                    not: ()=>({ isLength:()=>({})}),
                    exists: ()=>({ isLength:()=>({})}),
                    isString: ()=>({ isLength:()=>({})}),
                    notEmpty: ()=>({ isLength:()=>({})}),
                    values: ()=>({ isLength:()=>({})}),
                })),
            }));
            const inputChoice={grouping: "model", model:"provasuccesso"}
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next() );
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next()});
            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce(inputProduct);
            const response = await request(app).get(baseURL + `/products/available?grouping=${inputChoice.grouping}&model=${inputChoice.model}`);
            expect(response.status).toBe(200)
            expect(response.body).toEqual(inputProduct);
            expect(ProductController.prototype.getAvailableProducts).toBeCalledTimes(1)
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledWith(inputChoice.grouping, undefined, inputChoice.model);        

        });


        test("It should return a 422 error code when grouping null but category and model no", async () => {
            const inputProduct = [{ sellingPrice: 57.00, model: "prova422", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 10 }]
            jest.mock('express-validator', () => ({
                query: jest.fn().mockImplementation(() => ({
                    equals: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                    not: ()=>({ isLength:()=>({})}),
                    exists: ()=>({ isLength:()=>({})}),
                    isString: ()=>({ isLength:()=>({})}),
                    notEmpty: ()=>({ isLength:()=>({})}),
                    values: ()=>({ isLength:()=>({})}),
                })),
            }));
            const inputChoice={grouping: "", category: Category.LAPTOP, model:"prova422"}
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                const errors = [{ msg: 'invalid input' }];
                return res.status(422).json({ errors });
            });
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next()});
            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValueOnce(new Error("errore parametri"));
            const response = await request(app).get(baseURL + `/products/available?grouping=${inputChoice.grouping}&category=${inputChoice.category}&model=${inputChoice.model}`);
            expect(response.status).toBe(422);
            expect(ProductController.prototype.getAvailableProducts).toBeCalledTimes(0);
        });
    
        test("It should return a 422 error code when grouping=category and category is null and model is not null", async () => {
            const inputProduct = [{ sellingPrice: 57.00, model: "prova422", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 10 }]
            jest.mock('express-validator', () => ({
                query: jest.fn().mockImplementation(() => ({
                    equals: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                    not: ()=>({ isLength:()=>({})}),
                    exists: ()=>({ isLength:()=>({})}),
                    isString: ()=>({ isLength:()=>({})}),
                    notEmpty: ()=>({ isLength:()=>({})}),
                    values: ()=>({ isLength:()=>({})}),
                })),
            }));
            const inputChoice={grouping: "category", category: "", model:"prova422"}
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                const errors = [{ msg: 'invalid input' }];
                return res.status(422).json({ errors });
            });
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next()});
            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValueOnce(new Error("errore parametri"));
            const response = await request(app).get(baseURL + `/products/available?grouping=${inputChoice.grouping}&category=${inputChoice.category}&model=${inputChoice.model}`);
            expect(response.status).toBe(422);
            expect(ProductController.prototype.getAvailableProducts).toBeCalledTimes(0);
        });


        test("It should return a 422 error code when grouping=model, model=null and category is not null", async () => {
            const inputProduct = [{ sellingPrice: 57.00, model: "prova422", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 10 }]
            jest.mock('express-validator', () => ({
                query: jest.fn().mockImplementation(() => ({
                    equals: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                    not: ()=>({ isLength:()=>({})}),
                    exists: ()=>({ isLength:()=>({})}),
                    isString: ()=>({ isLength:()=>({})}),
                    notEmpty: ()=>({ isLength:()=>({})}),
                    values: ()=>({ isLength:()=>({})}),
                })),
            }));
            const inputChoice={grouping: "model", category: Category.LAPTOP, model:""}
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                const errors = [{ msg: 'invalid input' }];
                return res.status(422).json({ errors });
            });
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next()});
            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValueOnce(new Error("errore parametri"));
            const response = await request(app).get(baseURL + `/products/available?grouping=${inputChoice.grouping}&category=${inputChoice.category}&model=${inputChoice.model}`);
            expect(response.status).toBe(422);
            expect(ProductController.prototype.getAvailableProducts).toBeCalledTimes(0);
        });

        test("It should return a 404 error code model not existing", async () => {
            const inputProduct = [{ sellingPrice: 57.00, model: "prova404", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 10 }]
            jest.mock('express-validator', () => ({
                query: jest.fn().mockImplementation(() => ({
                    equals: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                    not: ()=>({ isLength:()=>({})}),
                    exists: ()=>({ isLength:()=>({})}),
                    isString: ()=>({ isLength:()=>({})}),
                    notEmpty: ()=>({ isLength:()=>({})}),
                    values: ()=>({ isLength:()=>({})}),
                })),
            }));
            const inputChoice={grouping: "model", model:"prova404"}
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                const errors = [{ msg: 'invalid input' }];
                return res.status(404).json({ errors });
            });
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {return next()});
            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValueOnce(new ProductNotFoundError());
            const response = await request(app).get(baseURL + `/products/available?grouping=${inputChoice.grouping}&model=${inputChoice.model}`);
            expect(response.status).toBe(404);
            expect(ProductController.prototype.getAvailableProducts).toBeCalledTimes(1);
        });
    });


    
    describe("DELETE /products/:model", ()=>{
        beforeEach(() => {
            jest.clearAllMocks(); // Ripristina tutti i mock prima di ogni test
        });

        afterEach(() => {
            jest.resetAllMocks(); // Ripristina tutti i mock dopo ogni test
            jest.restoreAllMocks(); // Ripristina i mock originali dopo ogni test
        });
        test("It should return a 200 success deleted product", async () => {
            const inputProduct = [{ sellingPrice: 57.00, model: "provasuccesso", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 10 }];
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    notEmpty: () => ({ isLength: () => ({}) }),
                })),
            }));
            const inputChoice={model:"provasuccesso"}
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next() );
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {return next()});
            jest.spyOn(ProductController.prototype, "deleteProduct").mockResolvedValueOnce(true);
            const response = await request(app).delete(baseURL + `/products/${inputChoice.model}`);
            expect(response.status).toBe(200)
            expect(ProductController.prototype.deleteProduct).toBeCalledTimes(1)
            expect(ProductController.prototype.deleteProduct).toHaveBeenCalledWith(inputChoice.model);        
        })

        test("It should return a 404 error code model not existing", async () => {
            const inputProduct = [{ sellingPrice: 57.00, model: "prova404", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 10 }]
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    notEmpty: () => ({ isLength: () => ({}) }),
                })),
            }));
            const inputChoice={model:"provaerrore404"}
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                const errors = [{ msg: 'invalid input' }];
                return res.status(404).json({ errors });
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {return next()});
            jest.spyOn(ProductController.prototype, "deleteProduct").mockRejectedValueOnce(new ProductNotFoundError());
            const response = await request(app).delete(baseURL + `/products/${inputChoice.model}`);
            expect(response.status).toBe(404);
            expect(ProductController.prototype.deleteProduct).toBeCalledTimes(1);
        });

    })

    describe("DELETE /products", ()=>{
        beforeEach(() => {
            jest.clearAllMocks(); // Ripristina tutti i mock prima di ogni test
        });

        afterEach(() => {
            jest.resetAllMocks(); // Ripristina tutti i mock dopo ogni test
            jest.restoreAllMocks(); // Ripristina i mock originali dopo ogni test
        });
        test("It should return a 200 success delete Products", async () => {
            const inputProduct = [{ sellingPrice: 57.00, model: "provasuccesso", category: Category.LAPTOP, arrivalDate: "2015-01-01", details: "test", quantity: 10 },
                { sellingPrice: 77.00, model: "provasuccesso2", category: Category.APPLIANCE, arrivalDate: "2018-01-01", details: "test", quantity: 20 }
            ];
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next() );
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {return next()});
            jest.spyOn(ProductController.prototype, "deleteAllProducts").mockResolvedValueOnce(true);
            const response = await request(app).delete(baseURL + `/products`);
            expect(response.status).toBe(200)
            expect(ProductController.prototype.deleteAllProducts).toBeCalledTimes(1)       
        })

        test("It should return a 404 error code products not found", async () => {
            const inputProduct = []
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    notEmpty: () => ({ isLength: () => ({}) }),
                })),
            }));
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                const errors = [{ msg: 'no products' }];
                return res.status(404).json({ errors });
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {return next()});
            jest.spyOn(ProductController.prototype, "deleteAllProducts").mockRejectedValueOnce(new ProductNotFoundError());
            const response = await request(app).delete(baseURL + `/products`);
            expect(response.status).toBe(404);
            expect(ProductController.prototype.deleteAllProducts).toBeCalledTimes(1);
        });


    });





});
   

