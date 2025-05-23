# Project Estimation - CURRENT

Date: 2024-04-26

Version: 1.0

# Estimation approach

Consider the EZElectronics project in CURRENT version (as given by the teachers), assume that you are going to develop the project INDEPENDENT of the deadlines of the course, and from scratch

# Estimate by size

### Details
To compute NC and AVG LOC per class, we have considered the following classes:
1) User (150 LOC)
2) Catalogue (150 LOC)
3) Cart (150 LOC)
4) Product (150 LOC)
5) CartHandler (500 LOC)
6) CatalogueHandler (500 LOC)
7) AuthenticatorHandler (500 LOC)

> Average size per class = (150\*4 + 500\*3) / 7 = 300 LOC

###

|                                                                                                        | Estimate  |
| ------------------------------------------------------------------------------------------------------ | --------- |
| NC = Estimated number of classes to be developed                                                       | 7         |
| A = Estimated average size per class, in LOC                                                           | 300 LOC   |
| B = Estimated size of frontend, in LOC                                                                 | 1800 LOC  |
| D = Estimated size of requirement document, in LOC                                                     | 466 LOC   |
| F = Estimated size of API document, in LOC                                                             | 387 LOC   |
| G = Estimated size of tests, in LOC                                                                    | 700 LOC   |
| S = Estimated size of project, in LOC (= NC\*A+B+D+F+G)                                                      | 5453 LOC  |
| E = Estimated effort, in person hours (here use productivity 10 LOC per person hour)                   | 545 PH    |
| C = Estimated cost, in euro (here use 1 person hour cost = 30 euro)                                    | 16350 €   |
| Estimated calendar time, in calendar weeks (Assume team of 4 people, 8 hours per day, 5 days per week) | 3.4 weeks |

# Estimate by product decomposition

###

| component name       | Estimated effort (person hours) |
| -------------------- | ------------------------------- |
| requirement document | 25                              |
| GUI prototype        | 10                              |
| design document      | 10                              |
| code: frontend       | 180                             |
| code: backend        | 210                             |
| unit tests           | 30                              |
| api tests            | 20                              |
| management documents | 10                              |

# Estimate by activity decomposition

###

| Activity name                               | Estimated effort (person hours) |
| ------------------------------------------- | ------------------------------- |
| Review existing code                        | 8                               |
| Defining requirements                       | 20                              |
| Model GUI                                   | 10                              |
| Estimation                                  | 12                              |
| Design                                      | 10                              |
| Test data                                   | 8                               |
| Prepare software requirements specification | 16                              |
| Software requirements review                | 8                               |
| API documentation                           | 8                               |
| Coding: frontend                            | 180                             |
| Coding: backend                             | 210                             |
| Test plan                                   | 6                               |
| Software testing                            | 40                              |

###

![Alt text](./images/ActivitiesGanttV1.png)

# Summary

Report here the results of the three estimation approaches. The estimates may differ. Discuss here the possible reasons for the difference.

How we computed estimated duration: we have divided the effort in person-hours by the number of team members (4)

|                                    | Estimated effort | Estimated duration |
| ---------------------------------- | ---------------- | ------------------ |
| estimate by size                   | 545 PH           | 136.2 h            |
| estimate by product decomposition  | 494 PH           | 123.8 h            |
| estimate by activity decomposition | 590 PH           | 147.5 h            |
