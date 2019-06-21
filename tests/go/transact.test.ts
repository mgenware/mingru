import { testBuildAsync } from './common';
import deptManagerTA from '../models/deptManagerTA';
import employeeTA from '../models/employeeTA';
import deptTA from '../models/deptTA';

test('TX', async () => {
  await testBuildAsync(employeeTA, 'tx/tx/employee');
  await testBuildAsync(deptTA, 'tx/tx/dept');
  await testBuildAsync(deptManagerTA, 'tx/tx/deptManager');
});
