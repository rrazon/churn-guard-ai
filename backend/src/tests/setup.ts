import { database } from '../services/database';

beforeEach(() => {
  database.users = [];
  database.customers = [];
  database.interventions = [];
  database.churnPredictions = [];
  database.tasks = [];
});

jest.setTimeout(30000);
