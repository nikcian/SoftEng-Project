import { describe, test, expect, beforeAll, beforeEach, afterAll, afterEach, jest } from "@jest/globals";

import ProductDAO from "../../src/dao/productDAO";
import { Category, Product } from "../../src/components/product";
import { EmptyProductStockError, LowProductStockError, ProductAlreadyExistsError, ProductNotFoundError } from "../../src/errors/productError";
import ProductController from "../../src/controllers/productController";
import { DateError } from "../../src/utilities";

jest.mock("../../src/dao/productDAO");
let productController: ProductController;

describe("test registrazione prodotto", ()=>{
    beforeEach(() => {
        productController = new ProductController();
      });
    
    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
      });
    
    test("registrare nuovo prodotto", async()=>{
        const testProduct=new Product(89.00,"test modello", Category.LAPTOP,"2023-07-07","test descrizione",20)
        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(new ProductNotFoundError());
        jest.spyOn(ProductDAO.prototype, "insertProduct").mockResolvedValueOnce(true);
        const controller=new ProductController();
        const response= await controller.registerProducts(testProduct.model, testProduct.category,testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate);

        expect(ProductDAO.prototype.insertProduct).toBeCalledTimes(1);
        expect(ProductDAO.prototype.insertProduct).toBeCalledWith(testProduct);
        expect(response).toBe(null);
    });

    test("registrare  prodotto esistente", async()=>{
        const testProduct=new Product(89.00,"test modello", Category.LAPTOP,"2023-07-07","test descrizione",20)
        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(testProduct);
        jest.spyOn(ProductDAO.prototype, "insertProduct").mockRejectedValueOnce(new ProductAlreadyExistsError());
        const controller=new ProductController();
        const response= controller.registerProducts(testProduct.model, testProduct.category,testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate);
        await expect(response).rejects.toThrow(new ProductAlreadyExistsError());
        expect(ProductDAO.prototype.insertProduct).toBeCalledTimes(0);
        
    });

    test("registrare nuovo prodotto errore data", async()=>{
        const testProduct=new Product(89.00,"test modello", Category.LAPTOP,"2073-07-07","test descrizione",20)
        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockRejectedValueOnce(new ProductNotFoundError());
        jest.spyOn(ProductDAO.prototype, "insertProduct").mockResolvedValueOnce(true);
        const controller=new ProductController();
        const response= controller.registerProducts(testProduct.model, testProduct.category,testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate);
        await expect(response).rejects.toThrow(new DateError());
        expect(ProductDAO.prototype.insertProduct).toBeCalledTimes(0);
         
    });
    
    test("registrare nuovo prodotto errore", async()=>{
        const testProduct=new Product(89.00,"test modello", Category.LAPTOP,"2023-07-07","test descrizione",20)
        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockRejectedValueOnce(new Error("errore registrazione"));
        jest.spyOn(ProductDAO.prototype, "insertProduct").mockResolvedValueOnce(true);
        const controller=new ProductController();
        const response= controller.registerProducts(testProduct.model, testProduct.category,testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate);
        await expect(response).rejects.toStrictEqual(new Error("errore registrazione"));
        expect(ProductDAO.prototype.insertProduct).toBeCalledTimes(0);
        
    });



    
});

describe("cambio quantita", ()=>{
    beforeEach(() => {
        productController = new ProductController();
    });

    test("cambio quantita prodotto", async ()=>{
        const testProduct=new Product(89.00,"test modello", Category.LAPTOP,"2023-07-07","test descrizione",20);
        const testNewQuantity=30;
        const testModel= "test modello";
        const newProductTest=new Product(89.00,"test modello", Category.LAPTOP,"2023-07-07","test descrizione",testNewQuantity+testProduct.quantity);

        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(testProduct);
        jest.spyOn(ProductDAO.prototype, "updateProduct").mockResolvedValueOnce(true);
        const controller=new ProductController();
        const response = await controller.changeProductQuantity(testModel,testNewQuantity,newProductTest.arrivalDate);
        expect(ProductDAO.prototype.updateProduct).toBeCalledTimes(1);
        expect(ProductDAO.prototype.updateProduct).toBeCalledWith(newProductTest, testModel); 
        expect(response).toBe(newProductTest.quantity);  

    });

    test("cambio quantita prodotto inesistente", async ()=>{
        const testProduct=new Product(89.00,"test modello", Category.LAPTOP,"2023-07-07","test descrizione",20);
        const testNewQuantity=30;
        const testModel= "test modello1";
        const newProductTest=new Product(89.00,"test modello", Category.LAPTOP,"2023-08-08","test descrizione",testNewQuantity+testProduct.quantity);

        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockRejectedValueOnce(new ProductNotFoundError);
        jest.spyOn(ProductDAO.prototype, "updateProduct").mockResolvedValueOnce(true);
        const controller=new ProductController();
        const response = controller.changeProductQuantity(testModel,testNewQuantity,"2023-08-08");
        await expect(response).rejects.toThrow(new ProductNotFoundError());
        expect(ProductDAO.prototype.updateProduct).toBeCalledTimes(0);

    });

    test("cambio quantita prodotto data errata", async ()=>{
        const testProduct=new Product(89.00,"test modello", Category.LAPTOP,"2023-07-07","test descrizione",20);
        const testNewQuantity=30;
        const testModel= "test modello";
        const newProductTest=new Product(89.00,"test modello", Category.LAPTOP,"2073-08-08","test descrizione",testNewQuantity+testProduct.quantity);

        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(testProduct);
        jest.spyOn(ProductDAO.prototype, "updateProduct").mockResolvedValueOnce(true);
        const controller=new ProductController();
        const response = controller.changeProductQuantity(testModel,testNewQuantity,newProductTest.arrivalDate);
        await expect(response).rejects.toThrow(new DateError());
        expect(ProductDAO.prototype.updateProduct).toBeCalledTimes(0);

    });


    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
      });
});


describe("vendita prodotti", ()=>{
    beforeEach(() => {
        productController = new ProductController();
    });

    test("sellProduct", async ()=>{
        const testProduct=new Product(89.00,"test modello", Category.LAPTOP,"2023-07-07","test descrizione",20);
        const testQuantitySale=5;
        const testModel= "test modello";
        const newProductTest=new Product(89.00,"test modello", Category.LAPTOP,"2023-07-07","test descrizione",testProduct.quantity-testQuantitySale);
        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(testProduct);
        jest.spyOn(ProductDAO.prototype, "updateProduct").mockResolvedValueOnce(true);
        const controller=new ProductController();
        const response = await controller.sellProduct(testModel,testQuantitySale,"2023-08-08");
        expect(ProductDAO.prototype.updateProduct).toBeCalledTimes(1);
        expect(ProductDAO.prototype.updateProduct).toBeCalledWith(newProductTest,testModel); 
        expect(response).toBe(testProduct.quantity-testQuantitySale);   

    });

    test("sellProduct product not found", async ()=>{
        const testProduct=new Product(89.00,"test modello", Category.LAPTOP,"2023-07-07","test descrizione",20);
        const testQuantitySale=5;
        const testModel= "test modello";
        const newProductTest=new Product(89.00,"test modello", Category.LAPTOP,"2023-07-07","test descrizione",testProduct.quantity-testQuantitySale);
        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockRejectedValueOnce(new ProductNotFoundError());
        jest.spyOn(ProductDAO.prototype, "updateProduct").mockResolvedValueOnce(true);
        const controller=new ProductController();
        const response = controller.sellProduct(testModel,testQuantitySale,"2023-08-08");
        await expect(response).rejects.toThrow(new ProductNotFoundError());
        expect(ProductDAO.prototype.updateProduct).toBeCalledTimes(0);  

    });

    test("sellProduct quantity=0", async ()=>{
        const testProduct=new Product(89.00,"test modello", Category.LAPTOP,"2023-07-07","test descrizione",0);
        const testQuantitySale=5;
        const testModel= "test modello";
        const newProductTest=new Product(89.00,"test modello", Category.LAPTOP,"2023-07-07","test descrizione",testProduct.quantity-testQuantitySale);
        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(testProduct);
        jest.spyOn(ProductDAO.prototype, "updateProduct").mockResolvedValueOnce(true);
        const controller=new ProductController();
        const response = controller.sellProduct(testModel,testQuantitySale,"2023-08-08");
        await expect(response).rejects.toThrow(new EmptyProductStockError());
        expect(ProductDAO.prototype.updateProduct).toBeCalledTimes(0);    

    });

    test("sellProduct low stock", async ()=>{
        const testProduct=new Product(89.00,"test modello", Category.LAPTOP,"2023-07-07","test descrizione",10);
        const testQuantitySale=15;
        const testModel= "test modello";
        const newProductTest=new Product(89.00,"test modello", Category.LAPTOP,"2023-07-07","test descrizione",testProduct.quantity-testQuantitySale);
        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(testProduct);
        jest.spyOn(ProductDAO.prototype, "updateProduct").mockResolvedValueOnce(true);
        const controller=new ProductController();
        const response = controller.sellProduct(testModel,testQuantitySale,"2023-08-08");
        await expect(response).rejects.toThrow(new LowProductStockError());
        expect(ProductDAO.prototype.updateProduct).toBeCalledTimes(0);    
    });


    test("sellProduct wrong sellingDate", async ()=>{
        const testProduct=new Product(89.00,"test modello", Category.LAPTOP,"2023-07-07","test descrizione",10);
        const testQuantitySale=5;
        const testModel= "test modello";
        const newProductTest=new Product(89.00,"test modello", Category.LAPTOP,"2023-07-07","test descrizione",testProduct.quantity-testQuantitySale);
        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(testProduct);
        jest.spyOn(ProductDAO.prototype, "updateProduct").mockResolvedValueOnce(true);
        const controller=new ProductController();
        const response = controller.sellProduct(testModel,testQuantitySale,"2073-08-08");
        await expect(response).rejects.toThrow(new DateError());
        expect(ProductDAO.prototype.updateProduct).toBeCalledTimes(0);    

    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
      });
});


describe("cancella un prodotto", ()=>{
    beforeEach(() => {
        productController = new ProductController();
    });

    test("DeleteProduct", async ()=>{
        const testModel= "test modello";
        jest.spyOn(ProductDAO.prototype, "deleteProductByModel").mockResolvedValueOnce(true);
        const controller=new ProductController();
        const response = await controller.deleteProduct(testModel);

        expect(ProductDAO.prototype.deleteProductByModel).toBeCalledTimes(1);
        expect(ProductDAO.prototype.deleteProductByModel).toBeCalledWith(testModel); 
        expect(response).toBe(true);   

    });

    test("DeleteProduct erroe", async ()=>{
        const testModel= "test modello";
        jest.spyOn(ProductDAO.prototype, "deleteProductByModel").mockRejectedValueOnce(new Error("errore delete model"));
        const controller=new ProductController();
        const response =  controller.deleteProduct(testModel);
        await expect(response).rejects.toStrictEqual(new Error("errore delete model"));
        expect(ProductDAO.prototype.deleteProductByModel).toBeCalledTimes(1);
           

    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
      });
});

describe("cancella tutti prodotti", ()=>{
    beforeEach(() => {
        productController = new ProductController();
    });
    test("DeleteAllProduct", async ()=>{

        jest.spyOn(ProductDAO.prototype, "deleteProducts").mockResolvedValueOnce(true);
        const controller=new ProductController();
        const response = await controller.deleteAllProducts();

        expect(ProductDAO.prototype.deleteProducts).toBeCalledTimes(1);
        expect(ProductDAO.prototype.deleteProducts).toBeCalledWith(); 
        expect(response).toBe(true);   

    });

    test("DeleteAllProduct errore", async ()=>{

        jest.spyOn(ProductDAO.prototype, "deleteProducts").mockRejectedValueOnce(new Error("errore"));
        const controller=new ProductController();
        const response = controller.deleteAllProducts();
        await expect(response).rejects.toStrictEqual(new Error("errore"));   
        expect(ProductDAO.prototype.deleteProducts).toBeCalledTimes(1);
        

    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
      });
});

describe("get Prodotti",()=>{
    beforeEach(() => {
        productController = new ProductController();
    });
    
    test("getProductsbyModel", async ()=>{
        const testProduct = [{ sellingPrice: 55.00, model: "provagetproductgroupingmodel", category: Category.LAPTOP, arrivalDate: "", details: "provagrouping", quantity: 13 },
        { sellingPrice: 75.00, model: "blablabla", category: Category.SMARTPHONE, arrivalDate: "", details: "provagrouping", quantity: 23 }
        ];
        const testgrouping="model";
        jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce(testProduct);
        const controller=new ProductController();
        const response= await controller.getProducts(testgrouping," ","provagetproductgroupingmodel");
        expect(ProductDAO.prototype.getProducts).toBeCalledTimes(1);
        expect(response).toEqual([new Product(testProduct[0].sellingPrice, testProduct[0].model, testProduct[0].category, testProduct[0].arrivalDate, testProduct[0].details, testProduct[0].quantity)]);
    });
    
    test("getProductsbyCategory", async ()=>{
        const testProduct = [{ sellingPrice: 55.00, model: "provagetproductgroupingmodel", category: Category.LAPTOP, arrivalDate: "", details: "provagrouping", quantity: 13 },
        { sellingPrice: 75.00, model: "blablabla", category: Category.SMARTPHONE, arrivalDate: "", details: "provagrouping", quantity: 23 }
        ];
        const testgrouping="category";
        jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce(testProduct);
        const controller=new ProductController();
        const response= await controller.getProducts(testgrouping,"Laptop","");
        expect(ProductDAO.prototype.getProducts).toBeCalledTimes(1);
        expect(response).toEqual([new Product(testProduct[0].sellingPrice, testProduct[0].model, testProduct[0].category, testProduct[0].arrivalDate, testProduct[0].details, testProduct[0].quantity)]);
    });


    test("getProductsbyModel product not found", async ()=>{
        const testProduct : Product[]=[];
        const testgrouping="model";
        jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce(testProduct);
        const controller=new ProductController();
        const response= controller.getProducts(testgrouping," ","provagetproductgroupingmodel");
        await expect(response).rejects.toThrow(new ProductNotFoundError());
        expect(ProductDAO.prototype.getProducts).toBeCalledTimes(1); 

    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });
})



describe("getProdottiDisponibili",()=>{
    beforeEach(() => {
        productController = new ProductController();
    });
    test("getProductsAvailablebyModel", async ()=>{
        const testProduct=[{ sellingPrice: 55.00, model: "provagetproductgroupingmodel", category: Category.LAPTOP, arrivalDate: "", details: "provagrouping", quantity: 13 }];
        const testgrouping="model";
        jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce(testProduct);
        const controller=new ProductController();
        const response= await controller.getAvailableProducts(testgrouping," ","provagetproductgroupingmodel");
        expect(ProductDAO.prototype.getProducts).toBeCalledTimes(1);
        expect(response).toEqual([new Product(testProduct[0].sellingPrice, testProduct[0].model, testProduct[0].category, testProduct[0].arrivalDate, testProduct[0].details, testProduct[0].quantity)]);
    });

    test("getProductsAvailablebyModel errore funzione", async ()=>{
        const testProduct=[{ sellingPrice: 55.00, model: "provagetproductgroupingmodel", category: Category.LAPTOP, arrivalDate: "", details: "provagrouping", quantity: 0 }];
        const testgrouping="model";
        jest.spyOn(ProductDAO.prototype, "getProducts").mockRejectedValueOnce(testProduct);
        const controller=new ProductController();
        const response= controller.getAvailableProducts(testgrouping," ","provagetproductgroupingmodel");
        await expect(response).rejects.toStrictEqual(testProduct);
        expect(ProductDAO.prototype.getProducts).toBeCalledTimes(1); 
    
    });


    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    test("getProductsAvailablebyCategory", async ()=>{
        const testProduct=[new Product( 55.00,"provagetproductgroupingcategory", Category.LAPTOP, "", "provagrouping", 13 )];
        /*const testProduct = [{ sellingPrice: 55.00, model: "provagetproductgroupingmodel", category: Category.LAPTOP, arrivalDate: "", details: "provagrouping", quantity: 13 },
        { sellingPrice: 75.00, model: "blablabla", category: Category.SMARTPHONE, arrivalDate: "", details: "provagrouping", quantity: 23 }
        ];*/
       
        const testgrouping="category";
        jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce(testProduct);
        const controller=new ProductController();
        const response= await controller.getAvailableProducts(testgrouping,"Laptop","");

        expect(ProductDAO.prototype.getProducts).toBeCalledTimes(1);
        //expect(ProductDAO.prototype.getProducts).toBeCalledWith(testgrouping," ","provagetproductgroupingmodel");
        expect(response).toEqual(testProduct);


    });
    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });
});