import {Request, Response, Router as expressRouter} from 'express';
import AppConfig from '../configs/app';
import PersonRouter from './person';
import UserRouter from './user';
import CylinderRouter from './cylinder';
import InventoryRouter from './inventory';
import vehicleRouter from './vehicle';
import driverRouter from './driver';
import Uploader from '../controllers/Uploader';
import customerRouter from './customer';
import salesRouter from './sales';
import productionRouter from './production';
const uploader = new Uploader();

const router: expressRouter = expressRouter();

router.get('/', (req: Request, res: Response): void => {
  res.send(`You've reached api routes of ${AppConfig.appName}`);
});

router.use('/person', PersonRouter);
router.use('/user', UserRouter);
router.use('/cylinder', CylinderRouter);
router.use('/inventory', InventoryRouter);
router.use('/vehicle', vehicleRouter);
router.use('/driver', driverRouter);
router.use('/customer', customerRouter);
router.use('/sales', salesRouter);
router.use('/production', productionRouter);

router.post('/upload', uploader.fileUpload());

export default router;
