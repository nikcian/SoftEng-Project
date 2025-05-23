import { describe, test, jest, expect, beforeEach, beforeAll, afterAll, afterEach } from "@jest/globals"
import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO"
import { Role, User } from "../../src/components/user";
import { UnauthorizedUserError, UserAlreadyExistsError, UserNotAdminError, UserNotFoundError } from "../../src/errors/userError";
import { DateError } from "../../src/utilities";

jest.mock("../../src/dao/userDAO")

const testCustomer = new User("customer", "customer", "customer", Role.CUSTOMER, "", "");
const testAdmin = new User("admin", "admin", "admin", Role.ADMIN, "", "");
let userController: UserController;

describe("Unit tests for UserController", () => {
    beforeAll(() => {
        userController = new UserController();
    });

    afterAll(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    describe("createUser(...)", () => {
        //Example of a unit test for the createUser method of the UserController
        //The test checks if the method returns true when the DAO method returns true
        //The test also expects the DAO method to be called once with the correct parameters
        test("Success - should return true", async () => {
            const err = new UserNotFoundError();
            const testUser = { //Define a test user object
                username: "test",
                name: "test",
                surname: "test",
                password: "test",
                role: "Manager"
            }
            jest.spyOn(UserDAO.prototype, "createUser").mockResolvedValueOnce(true); //Mock the createUser method of the DAO
            //const controller = new UserController(); //Create a new instance of the controller
            //Call the createUser method of the controller with the test user object

            const mock_usernameAlreadyInUse = jest.spyOn(UserDAO.prototype, "getUserByUsername").mockRejectedValueOnce(err);
            
            const response = await userController.createUser(testUser.username, testUser.name, testUser.surname, testUser.password, testUser.role);
        
            //Check if the createUser method of the DAO has been called once with the correct parameters
            //await expect(mock_usernameAlreadyInUse).rejects.toStrictEqual(err);
            expect(mock_usernameAlreadyInUse).toHaveBeenCalled();
            expect(UserDAO.prototype.createUser).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.createUser).toHaveBeenCalledWith(testUser.username,
                testUser.name,
                testUser.surname,
                testUser.password,
                testUser.role);
            expect(response).toBe(true); //Check if the response is true
        });

        test("Username already exists - should return UserAlreadyExistsError", async () => {
            const err = new UserAlreadyExistsError();
            const testUser = { //Define a test user object
                username: "test",
                name: "test",
                surname: "test",
                password: "test",
                role: "Manager"
            }
            jest.spyOn(UserDAO.prototype, "createUser").mockResolvedValueOnce(true); //Mock the createUser method of the DAO
            //const controller = new UserController(); //Create a new instance of the controller
            //Call the createUser method of the controller with the test user object

            const mock_usernameAlreadyInUse = jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(testCustomer);
            
            const response = userController.createUser(testUser.username, testUser.name, testUser.surname, testUser.password, testUser.role);
        
            // Expect UserAlreadyExistsError
            await expect(response).rejects.toStrictEqual(err);
            expect(mock_usernameAlreadyInUse).toHaveBeenCalled();
        });
    });

    describe("getUser()", () => {
        test("Success - should return User[]", async () => {
            jest.spyOn(UserDAO.prototype, "getUsers").mockResolvedValueOnce([testCustomer]);
            const response = await userController.getUsers();
            expect(UserDAO.prototype.getUsers).toHaveBeenCalledTimes(1);
            expect(response).toStrictEqual([testCustomer]);
        });
    });

    describe("getUsersByRole(...)", () => {
        test("Success - should return User[]", async () => {
            const testRole = "Customer";
            jest.spyOn(UserDAO.prototype, "getUsers").mockResolvedValueOnce([testCustomer]);
            const response = await userController.getUsersByRole(testRole);
            expect(UserDAO.prototype.getUsers).toHaveBeenCalled();
            expect(response).toStrictEqual([testCustomer]);
        });

        test("Generic error from DAO", async () => {
            const testRole = "Customer";
            const err = new Error('DAO error');   // simulate a DAO fail
            jest.spyOn(UserDAO.prototype, "getUsers").mockRejectedValueOnce(err);
            const response = userController.getUsersByRole(testRole);
            await expect(response).rejects.toEqual(err);
            expect(UserDAO.prototype.getUsers).toHaveBeenCalled();
        });
    });

    describe("getUserByUsername(...)", () => {
        test("Success - should return User", async () => {
            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(testCustomer);
            const response = await userController.getUserByUsername(testAdmin, testCustomer.username);
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalled();
            expect(response).toStrictEqual(testCustomer);
        });

        test("Generic error from DAO", async () => {
            const err = new Error('DAO error');   // simulate a DAO fail
            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockRejectedValueOnce(err);
            const response = userController.getUserByUsername(testAdmin, testCustomer.username);
            await expect(response).rejects.toEqual(err);
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalled();
        });

        test("User is not an Admin", async () => {
            const response = userController.getUserByUsername(testCustomer, testAdmin.username);
            await expect(response).rejects.toEqual(new UserNotAdminError);
        });
    });
    
    describe("usernameAlreadyInUse(...)", () => {
        test("Username is already in use", async () => {
            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(testCustomer);
            const response = await userController.usernameAlreadyInUse(testCustomer.username);
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalled();
            expect(response).toBe(true);
        });

        test("Username not in use yet", async () => {
            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockRejectedValueOnce(new UserNotFoundError);
            const response = await userController.usernameAlreadyInUse(testCustomer.username);
            expect(response).toBe(false);
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalled();
        });

        test("Generic error from DAO", async () => {
            const err = new Error('DAO error');   // simulate a DAO fail
            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockRejectedValueOnce(err);
            const response = userController.usernameAlreadyInUse(testCustomer.username);
            await expect(response).rejects.toEqual(err);
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalled();
        });
    });

    describe("deleteUser(...)", () => {
        test("Success - should return true", async () => {
            jest.spyOn(UserDAO.prototype, "deleteUser").mockResolvedValueOnce(true);
            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(testCustomer);
            const response = await userController.deleteUser(testAdmin, testCustomer.username);
            expect(UserDAO.prototype.deleteUser).toHaveBeenCalled();
            expect(response).toStrictEqual(true);
        });

        test("Generic error from DAO", async () => {
            const err = new Error('DAO error');   // simulate a DAO fail
            jest.spyOn(UserDAO.prototype, "deleteUser").mockRejectedValueOnce(err);
            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(testCustomer);
            const response = userController.deleteUser(testAdmin, testCustomer.username);
            await expect(response).rejects.toEqual(err);
            expect(UserDAO.prototype.deleteUser).toHaveBeenCalled();
        });

        test("User is not an Admin", async () => {
            const response = userController.deleteUser(testCustomer, testAdmin.username);
            await expect(response).rejects.toEqual(new UserNotAdminError);
        });
    });

    describe("deleteAll()", () => {
        test("Success - should return true", async () => {
            jest.spyOn(UserDAO.prototype, "deleteAll").mockResolvedValueOnce(true);
            const response = await userController.deleteAll();
            expect(UserDAO.prototype.deleteAll).toHaveBeenCalled();
            expect(response).toStrictEqual(true);
        });

        test("Generic error from DAO", async () => {
            const err = new Error('DAO error');   // simulate a DAO fail
            jest.spyOn(UserDAO.prototype, "deleteAll").mockRejectedValueOnce(err);
            const response = userController.deleteAll();
            await expect(response).rejects.toEqual(err);
            expect(UserDAO.prototype.deleteAll).toHaveBeenCalled();
        });
        
        test("Users not found", async () => {
            jest.spyOn(UserDAO.prototype, "deleteAll").mockResolvedValueOnce(false);
            const response = userController.deleteAll();
            await expect(response).rejects.toEqual(new UserNotFoundError);
            expect(UserDAO.prototype.deleteAll).toHaveBeenCalled();
        });
    });

    describe("updateUserInfo(...)", () => {
        test("Success - should return the updated user", async () => {
            // Assuming that the DAO returns the updated user object
            jest.spyOn(UserDAO.prototype, "updateUserInfo").mockResolvedValueOnce(testCustomer);
            //Call the updateUserInfo method of the controller with the test user object
            const response = await userController.updateUserInfo(testCustomer, testCustomer.name, testCustomer.surname, testCustomer.address, testCustomer.birthdate, testCustomer.username);
        
            //Check if the updateUserInfo method of the DAO has been called once with the correct parameters
            expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalled();
            expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledWith(
                testCustomer.name,
                testCustomer.surname,
                testCustomer.address, 
                testCustomer.birthdate, 
                testCustomer.username);
            expect(response).toStrictEqual(testCustomer);
        });

        test("Customer tries to update another user information - should return 401", async () => {
            // Assuming that the DAO returns the updated user object
            jest.spyOn(UserDAO.prototype, "updateUserInfo").mockResolvedValueOnce(testCustomer);
            //Call the updateUserInfo method of the controller with the test user object
            const response = userController.updateUserInfo(
                testCustomer, 
                testCustomer.name, 
                testCustomer.surname, 
                testCustomer.address, 
                testCustomer.birthdate, 
                'other-customer-username'
            );
        
            await expect(response).rejects.toStrictEqual(new UnauthorizedUserError());
        });

        test("Customer tries to insert a birthdate > today - should return DateError", async () => {
            // Assuming that the DAO returns the updated user object
            jest.spyOn(UserDAO.prototype, "updateUserInfo").mockResolvedValueOnce(testCustomer);
            //Call the updateUserInfo method of the controller with the test user object
            const response = userController.updateUserInfo(
                testCustomer, 
                testCustomer.name, 
                testCustomer.surname, 
                testCustomer.address, 
                '4024-06-11', 
                'other-customer-username'
            );
        
            await expect(response).rejects.toEqual(new DateError());
        });
    });
});