import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Auth/Login';
import ProductForm from './components/ProductForm';
import ProductList from './components/ProductList';
import TableForm from './components/TableForm';
import TableList from './components/TableList';
import TableDetail from './components/TableDetail';
import OrdersReport from './components/OrdersReport';
import PaymentHistoryReport from './components/PaymentHistoryReport';
import AddIngredient from './components/AddInventoryWithCategory';
import AddProduct from './components/ProductForm';
import CreateBranch from './components/Auth/CreateBranch';
import VendorForm from './components/AddVendor';
import StockManagementForm from './components/AddStock';
import VendorPaymentDashboard from './components/VendorDashboard';
import { UserProvider } from './components/Auth/UserContext';
import InventoryDashboard from './components/InventoryDashboard';
import EditProduct from './components/Editproduct';
import Dues from './components/DuesPage';
// import { ThemeProvider, createTheme } from '@mui/material/styles';
import EditInventory from './components/updateinventory';
import VendorDetails from './components/VendorDetails';
// const theme = createTheme();

const App = () => (
    
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/admin" element={<CreateBranch />} />
                <Route path="/add-product" element={<AddProduct />} />
                <Route path="/products" element={<ProductList />} />
                <Route path="/usersidebar/billing" element={<TableList />} />
                <Route path="/add-table" element={<TableForm />} />
                <Route path="/table/:tableId" element={<TableDetail />} />
                <Route path="/report/order" element={<OrdersReport />} />
                <Route path="/add-ingredient" element={<AddIngredient />} /> {/* Updated for clarity */}
                <Route path="/report/payments" element={<PaymentHistoryReport />} /> {/* Updated for clarity */}
                <Route path="/add-vendor"element={<VendorForm />} />
                <Route path="/add-stock"element={<StockManagementForm />} />
                <Route path="/vendordashboard"element={<VendorPaymentDashboard/>} />
                <Route path ="/report/dues"element={<Dues/>} />
                <Route path="/inventorydashboard"element={<InventoryDashboard/>} />
                 <Route path="/editproduct/:id" element={<EditProduct/>} />
                 <Route path="/editinventory/:id" element={<EditInventory/>} />
                 <Route path="/vendor/:vendorId" element={<VendorDetails />} />
                {/* Add a catch-all route for 404 */}
                <Route path="*" element={<h1>404 Not Found</h1>} />
            </Routes>
        </Router>
    
);

export default App;
