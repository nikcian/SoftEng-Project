import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"

import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO"
import crypto from "crypto"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import { Role, User } from "../../src/components/user"
import { UserAlreadyExistsError, UserNotFoundError } from "../../src/errors/userError"

jest.mock("crypto")
jest.mock("../../src/db/db.ts")


const testCustomer = new User("customer", "customer", "customer", Role.CUSTOMER, "", "");
const testAdmin = new User("admin", "admin", "admin", Role.ADMIN, "", "");
const testCustomerJson = {username: "customer", name: "customer", surname: "customer", role: "Customer", password: "password", salt: "salt", address: "", birthdate: ""};
const testPassword = "test";
let userDAO: UserDAO;


describe("Unit tests for UserDAO", () => {
    beforeAll(() => {
        userDAO = new UserDAO;
    });
      
    afterAll(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    describe("getIsUserAuthenticated(...)", () => {
        test("The user is authenticated", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, testCustomerJson);
                return {} as Database;
            });

            const mockTimingSafeEqual = jest.spyOn(crypto, "timingSafeEqual").mockImplementation(() => {
                return true;
            });

            const result = await userDAO.getIsUserAuthenticated(testCustomer.username, testPassword);
            expect(result).toBe(true);
            expect(mockDBGet).toHaveBeenCalled();
            expect(mockTimingSafeEqual).toHaveBeenCalled();
        });

        test("Password not valid", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, testCustomerJson);
                return {} as Database;
            });

            const mockTimingSafeEqual = jest.spyOn(crypto, "timingSafeEqual").mockImplementation(() => {
                return false;
            });

            const result = await userDAO.getIsUserAuthenticated(testCustomer.username, testPassword);
            expect(result).toBe(false);
            expect(mockDBGet).toHaveBeenCalled();
            expect(mockTimingSafeEqual).toHaveBeenCalled();
        });

        test("There is no user with the given username", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, null);
                return {} as Database;
            });

            const result = await userDAO.getIsUserAuthenticated(testCustomer.username, testPassword);
            expect(result).toBe(false);
            expect(mockDBGet).toHaveBeenCalled();
        });

        test("An error occours in DB", async () => {
            const err = new Error("generic error");
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(err, testCustomerJson);
                return {} as Database;
            });

            const result = userDAO.getIsUserAuthenticated(testCustomer.username, testPassword);
            await expect(result).rejects.toEqual(err);
            expect(mockDBGet).toHaveBeenCalled();
        });
    });

    describe("createUser(...)", () => {
        test("User created successfully", async () => {
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });
            const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
                return (Buffer.from("salt"))
            })
            const mockScrypt = jest.spyOn(crypto, "scryptSync").mockImplementation((password, salt, keylen) => {
                return Buffer.from("hashedPassword")
            })
            const result = await userDAO.createUser("username", "name", "surname", "password", "role");
            expect(result).toBe(true);
            expect(mockDBRun).toHaveBeenCalled();
            expect(mockRandomBytes).toHaveBeenCalled();
            expect(mockScrypt).toHaveBeenCalled();
        });

        test("User already exists", async () => {
            const err = new Error("UNIQUE constraint failed: users.username");
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(err)
                return {} as Database
            });
            const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
                return (Buffer.from("salt"))
            })
            const mockScrypt = jest.spyOn(crypto, "scryptSync").mockImplementation((password, salt, keylen) => {
                return Buffer.from("hashedPassword")
            })
            const result = userDAO.createUser("username", "name", "surname", "password", "role");
            await expect(result).rejects.toEqual(new UserAlreadyExistsError);
            expect(mockDBRun).toHaveBeenCalled();
            expect(mockRandomBytes).toHaveBeenCalled();
            expect(mockScrypt).toHaveBeenCalled();
        });

        test("An error occours in DB", async () => {
            const err = new Error("generic error");
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(err)
                return {} as Database
            });
            const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
                return (Buffer.from("salt"))
            })
            const mockScrypt = jest.spyOn(crypto, "scryptSync").mockImplementation((password, salt, keylen) => {
                return Buffer.from("hashedPassword")
            })
            const result = userDAO.createUser("username", "name", "surname", "password", "role");
            await expect(result).rejects.toEqual(err);
            expect(mockDBRun).toHaveBeenCalled();
            expect(mockRandomBytes).toHaveBeenCalled();
            expect(mockScrypt).toHaveBeenCalled();
        });
    });

    describe("getUserByUsername(...)", () => {
        test("Success - gets the user", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, testCustomerJson);
                return {} as Database;
            });

            const result = await userDAO.getUserByUsername(testCustomer.username);
            expect(result).toStrictEqual(testCustomer);
            expect(mockDBGet).toHaveBeenCalled();
        });

        test("There is no user with the given username", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, null);
                return {} as Database;
            });

            const result = userDAO.getUserByUsername(testCustomer.username);
            await expect(result).rejects.toEqual(new UserNotFoundError);
            expect(mockDBGet).toHaveBeenCalled();
        });

        test("An error occours in DB", async () => {
            const err = new Error("generic error");
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(err, testCustomerJson);
                return {} as Database;
            });

            const result = userDAO.getUserByUsername(testCustomer.username);
            await expect(result).rejects.toEqual(err);
            expect(mockDBGet).toHaveBeenCalled();
        });
    });

    describe("mapDBrowToUserObject(...)", () => {
        test("Map DB row object into a new User", () => {
            const result = userDAO.mapDBrowToUserObject(testCustomerJson);
            expect(result).toStrictEqual(testCustomer);
        });
    });

    describe("getUsers()", () => {
        test("Success - gets the users", async () => {
            const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [testCustomerJson]);
                return {} as Database;
            });

            const result = await userDAO.getUsers();
            expect(result).toStrictEqual([testCustomer]);
            expect(mockDBGet).toHaveBeenCalled();
        });

        test("No User found", async () => {
            const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, undefined);
                return {} as Database;
            });

            const result = userDAO.getUsers();
            await expect(result).rejects.toEqual(new UserNotFoundError);
            expect(mockDBGet).toHaveBeenCalled();
        });

        test("An error occours in DB", async () => {
            const err = new Error("generic error");
            const mockDBGet = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(err, [testCustomerJson]);
                return {} as Database;
            });

            const result = userDAO.getUsers();
            await expect(result).rejects.toEqual(err);
            expect(mockDBGet).toHaveBeenCalled();
        });
    });

    describe("deleteUser(...)", () => {
        test("User deleted successfully", async () => {
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback.call({changes: 1}, null);
                return {} as Database
            });

            const result = await userDAO.deleteUser(testCustomer.username);
            expect(result).toBe(true);
            expect(mockDBRun).toHaveBeenCalled();
        });

        test("User does not exists", async () => {
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback.call({changes: 0}, null)
                return {} as Database
            });

            const result = await userDAO.deleteUser(testCustomer.username)
            expect(result).toBe(false);
            expect(mockDBRun).toHaveBeenCalled();
        });

        test("An error occours in DB", async () => {
            const err = new Error("generic error");
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(err)
                return {} as Database
            });

            const result = userDAO.deleteUser(testCustomer.username)
            await expect(result).rejects.toEqual(err);
            expect(mockDBRun).toHaveBeenCalled();
        });
    });

    describe("deleteAll()", () => {
        test("All user deleted successfully", async () => {
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback.call({changes: 1}, null);
                return {} as Database
            });

            const result = await userDAO.deleteAll();
            expect(result).toBe(true);
            expect(mockDBRun).toHaveBeenCalled();
        });

        test("No User found", async () => {
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback.call({changes: 0}, null)
                return {} as Database
            });

            const result = await userDAO.deleteAll();
            expect(result).toBe(false);
            expect(mockDBRun).toHaveBeenCalled();
        });

        test("An error occours in DB", async () => {
            const err = new Error("generic error");
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(err)
                return {} as Database
            });

            const result = userDAO.deleteAll();
            await expect(result).rejects.toEqual(err);
            expect(mockDBRun).toHaveBeenCalled();
        });
    });

    describe("updateUserInfo(...)", () => {
        test("User updated successfully", async () => {
            const testChanges = {name: "newName", surname: "newSurname", address: "newAddress", birthdate: "newBirthdate"};
            const testNewCustomer = new User(testCustomer.username, testChanges.name, testChanges.surname, testCustomer.role, testChanges.address, testChanges.birthdate);
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback.call({changes: 1}, null);
                return {} as Database
            });
            const mockGetUser = jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(testNewCustomer); 

            const result = await userDAO.updateUserInfo(testChanges.name, testChanges.surname, testChanges.address, testChanges.birthdate, testCustomer.username);
            expect(result).toStrictEqual(testNewCustomer);
            expect(mockDBRun).toHaveBeenCalled();
            expect(mockGetUser).toHaveBeenCalled();
        });

        test("User not found", async () => {
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database
            });
            const mockGetUser = jest.spyOn(UserDAO.prototype, "getUserByUsername").mockRejectedValueOnce(new UserNotFoundError);

            const result = userDAO.updateUserInfo("name", "surname", "address", "birthdate", "username");
            await expect(result).rejects.toEqual(new UserNotFoundError);
            expect(mockDBRun).toHaveBeenCalled();
            expect(mockGetUser).toHaveBeenCalled();
        });

        test("An error occours in DB", async () => {
            const err = new Error("generic error");
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(err);
                return {} as Database
            });

            const result = userDAO.updateUserInfo("name", "surname", "address", "birthdate", "username");
            await expect(result).rejects.toEqual(err);
            expect(mockDBRun).toHaveBeenCalled();
        });
    });


});


