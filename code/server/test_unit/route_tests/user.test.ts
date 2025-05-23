import { test, expect, jest, describe } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"

import UserController from "../../src/controllers/userController"
import ErrorHandler from "../../src/helper"
import { UnauthorizedUserError, UserAlreadyExistsError, UserNotFoundError } from "../../src/errors/userError"
import Authenticator from "../../src/routers/auth"
import { User, Role } from "../../src/components/user"
const baseURL = "/ezelectronics"


jest.mock("../../src/controllers/userController");
jest.mock("../../src/routers/auth");

let testCustomer = new User("customer", "customer", "customer", Role.CUSTOMER, "", "");

//Example of a unit test for the POST ezelectronics/users route
//The test checks if the route returns a 200 success code
//The test also expects the createUser method of the controller to be called once with the correct parameters

describe("Unit test for userRoutes", () => {
  describe("Route for creating a user", () => {
    test("It should return a 200 success code", async () => {
      //Define a test user object sent to the route
      const testUser = { username: "test",name: "test",surname: "test",password: "test",role: "Manager"};
      jest.mock('express-validator', () => ({
        body: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
          isIn: () => ({ isLength: () => ({}) }),
        })),
      }));

      jest.spyOn(UserController.prototype, "createUser").mockResolvedValueOnce(true) //Mock the createUser method of the controller
      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());

      const response = await request(app).post(baseURL + "/users").send(testUser) //Send a POST request to the route
      expect(response.status).toBe(200) //Check if the response status is 200
      expect(UserController.prototype.createUser).toHaveBeenCalledTimes(1) //Check if the createUser method has been called once
      //Check if the createUser method has been called with the correct parameters
      expect(UserController.prototype.createUser).toHaveBeenCalledWith(testUser.username,
        testUser.name,
        testUser.surname,
        testUser.password,
        testUser.role)
    });

    //It keeps failing, I don't know how to test a custom express validator - see userRoutes.ts
    test("Username already in use. Should return 409", async () => {
      const testUser = { username: "test",name: "test",surname: "test",password: "test",role: "Manager"};
      jest.mock('express-validator', () => ({
        body: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
          isIn: () => ({ isLength: () => ({}) }),
          custom: () => jest.fn(() => false) ,
        })),
      }));
      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next() );
      jest.spyOn(UserController.prototype, "createUser").mockRejectedValueOnce(new UserAlreadyExistsError());

      const response = await request(app).post(baseURL + "/users").send(testUser);
      expect(response.status).toBe(409)   // Expect to throw 409 error
    });
  });

  describe("Route for retrieving all users", () => {
    test("It should return a 200 success code", async () => {
      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
      jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => next());
      jest.spyOn(UserController.prototype, "getUsers").mockResolvedValueOnce([testCustomer]);
      
      const response = await request(app).get(baseURL + `/users/`);
      expect(response.status).toBe(200);
      expect(UserController.prototype.getUsers).toHaveBeenCalled();
    });

    test("Unauthorized user. Should return 401", async () => {
      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
      jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
        return res.status(401).json({ error: "Unauthorized" });
      });
      
      const response = await request(app).get(baseURL + `/users/`);
      expect(response.status).toBe(401);
    });

    test("No existing user. Should return 404", async () => {
      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
      jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => next());
      jest.spyOn(UserController.prototype, "getUsers").mockRejectedValueOnce(new UserNotFoundError());
      
      const response = await request(app).get(baseURL + `/users/`);
      expect(response.status).toBe(new UserNotFoundError().customCode);
    });
  });

  describe("Route for retrieving all users with a specific role", () => {
    test("It should return a 200 success code", async () => {
      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
      jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => next());
      jest.spyOn(UserController.prototype, "getUsersByRole").mockResolvedValueOnce([testCustomer]);
      
      const response = await request(app).get(baseURL + `/users/roles/${testCustomer.role}`);
      expect(response.status).toBe(200);
      expect(UserController.prototype.getUsersByRole).toHaveBeenCalled();
    });

    test("Unauthorized user. Should return 401", async () => {
      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
      jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
        return res.status(401).json({ error: "Unauthorized" });
      });
      
      const response = await request(app).get(baseURL + `/users/roles/${testCustomer.role}`);
      expect(response.status).toBe(401);
    });

    test("No existing user. Should return 404", async () => {
      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
      jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => next());
      jest.spyOn(UserController.prototype, "getUsersByRole").mockRejectedValueOnce(new UserNotFoundError());
      
      const response = await request(app).get(baseURL + `/users/roles/${testCustomer.role}`);
      expect(response.status).toBe(new UserNotFoundError().customCode);
    });
  });

  describe("Route for retrieving a single user with a specific username", () => {
    test("Admin get user's info (It should return a 200 success code)", async () => {
      jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
          isIn: () => ({ isLength: () => ({}) }),
        })),
      }));

      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
      jest.spyOn(UserController.prototype, "getUserByUsername").mockResolvedValueOnce(testCustomer);
      
      const response = await request(app).get(baseURL + `/users/${testCustomer.username}`);
      expect(response.status).toBe(200);
      expect(UserController.prototype.getUserByUsername).toHaveBeenCalled();
    });

    test("Unauthorized user. Should return 401", async () => {
      jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
          isIn: () => ({ isLength: () => ({}) }),
        })),
      }));

      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        return res.status(401).json({ error: "Unauthorized" });
      });
      
      const response = await request(app).get(baseURL + `/users/${testCustomer.username}`);
      expect(response.status).toBe(401);
    });

    test("No existing user. Should return 404", async () => {
      jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
          isIn: () => ({ isLength: () => ({}) }),
        })),
      }));

      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
      jest.spyOn(UserController.prototype, "getUserByUsername").mockRejectedValueOnce(new UserNotFoundError());
      
      const response = await request(app).get(baseURL + `/users/${testCustomer.username}`);
      expect(response.status).toBe(new UserNotFoundError().customCode);
    });
  });

  describe("Route for deleting a user", () => {
    test("DELETE users/:username", async () => {
      jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
          isIn: () => ({ isLength: () => ({}) }),
        })),
      }));

      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
      jest.spyOn(UserController.prototype, "deleteUser").mockResolvedValueOnce(true);
      
      const response = await request(app).delete(baseURL + `/users/${testCustomer.username}`);
      expect(response.status).toBe(200);
      expect(UserController.prototype.deleteUser).toHaveBeenCalled();
    });
    
    test("Unauthorized user. Should return 401", async () => {
      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        return res.status(401).json({ error: "Unauthorized" });
      });
      
      const response = await request(app).delete(baseURL + `/users/${testCustomer.username}`);
      expect(response.status).toBe(401);
    });

    test("No existing user. Should return 404", async () => {
      jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
          isIn: () => ({ isLength: () => ({}) }),
        })),
      }));

      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
      jest.spyOn(UserController.prototype, "deleteUser").mockRejectedValueOnce(new UserNotFoundError());
      
      const response = await request(app).delete(baseURL + `/users/${testCustomer.username}`);
      expect(response.status).toBe(404);
    });
    
  });

  describe("Route for deleting all users", () => {
    test("DELETE /users", async () => {
      jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
          isIn: () => ({ isLength: () => ({}) }),
        })),
      }));

      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
      jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => next());
      jest.spyOn(UserController.prototype, "deleteAll").mockResolvedValueOnce(true);
      
      const response = await request(app).delete(baseURL + `/users/`);
      expect(response.status).toBe(200);
      expect(UserController.prototype.deleteAll).toHaveBeenCalled();
    });
    
    test("Unauthorized user. Should return 401", async () => {
      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
      jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
        return res.status(401).json({ error: "Unauthorized" });
      });
      
      const response = await request(app).delete(baseURL + `/users/`);
      expect(response.status).toBe(401);
    });
    
    test("No existing user", async () => {
      jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
          isIn: () => ({ isLength: () => ({}) }),
        })),
      }));

      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
      jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => next());
      jest.spyOn(UserController.prototype, "deleteAll").mockRejectedValueOnce(new UserNotFoundError());
      
      const response = await request(app).delete(baseURL + `/users/`);
      expect(response.status).toBe(404);
    });
    
  });

  describe("Route for updating the information of a user", () => {
    test("PATCH users/:username", async () => {
      const testUser = { name: "test",surname: "test",address: "Corso Duca degli Abruzzi 129, Torino", birthdate: "1970-01-01" };
      const testModifiedUser = new User(testCustomer.username, testUser.name, testUser.surname, testCustomer.role, testUser.address, testUser.birthdate);
      jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
          isIn: () => ({ isLength: () => ({}) }),
        })),
      }));

      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
      jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        req.user = testCustomer;
        next();
      });
      jest.spyOn(UserController.prototype, "updateUserInfo").mockResolvedValueOnce(testModifiedUser);
      
      const response = await request(app).patch(baseURL + `/users/${testCustomer.username}`).send(testUser);
      expect(response.status).toBe(200);
      expect(UserController.prototype.updateUserInfo).toHaveBeenCalledTimes(1);
      expect(UserController.prototype.updateUserInfo).toHaveBeenCalledWith(
        testCustomer,
        testUser.name,
        testUser.surname,
        testUser.address,
        testUser.birthdate,
        testCustomer.username,
      )
    });

    test("Unauthorized user. Should return 401", async () => {
      const testUser = { name: "test",surname: "test",address: "Corso Duca degli Abruzzi 129, Torino", birthdate: "1970-01-01" };
      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
      jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => next());
      jest.spyOn(UserController.prototype, "updateUserInfo").mockRejectedValueOnce(new UnauthorizedUserError());
      
      const response = await request(app).patch(baseURL + `/users/${testCustomer.username}`).send(testUser);
      expect(response.status).toBe(401);
    });
    
    test("No existing user", async () => {
      const testUser = { name: "test",surname: "test",address: "Corso Duca degli Abruzzi 129, Torino", birthdate: "1970-01-01" };
      jest.mock('express-validator', () => ({
        param: jest.fn().mockImplementation(() => ({
          isString: () => ({ isLength: () => ({}) }),
          isIn: () => ({ isLength: () => ({}) }),
        })),
      }));

      jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
      jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => next());
      jest.spyOn(UserController.prototype, "updateUserInfo").mockRejectedValueOnce(new UserNotFoundError());
      
      const response = await request(app).patch(baseURL + `/users/${testCustomer.username}`).send(testUser);
      expect(response.status).toBe(404);
    });
    
  });
    
});
