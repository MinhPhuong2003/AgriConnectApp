import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SplashScreen from "../screens/SplashScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import AuthNavigator from "./AuthNavigator";
import ChangePasswordScreen from "../features/auth/ChangePasswordScreen";
import VerifyEmailScreen from "../features/auth/VerifyEmailScreen";
import ChatScreen from "../screens/ChatScreen";
import ChatDetailScreen from "../screens/ChatDetailScreen";
import CartScreen from "../screens/CartScreen";
import CheckoutScreen from "../screens/CheckoutScreen";
import MyOrderScreen from "../screens/MyOrderScreen";
import ShippingMethodScreen from "../screens/ShippingMethodScreen";
import PaymentMethodScreen from "../screens/PaymentMethodScreen";
import AddressScreen from "../screens/AddressScreen";
import AddAddressScreen from "../screens/AddAddressScreen";
import OrderSuccessScreen from "../screens/OrderSuccessScreen";
import OrderDetailScreen from "../screens/OrderDetailScreen";
import CancelOrderScreen from "../screens/CancelOrderScreen";
import CancelSuccessScreen from "../screens/CancelSuccessScreen";
import WritingReviewScreen from "../screens/WritingReviewScreen";
import ReviewScreen from "../screens/ReviewScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import HomeFarmerTabs from "./HomeFarmerTabs";
import HomeBuyerTabs from "./HomeBuyerTabs";
import CategoryProductsScreen from "../screens/CategoryProductsScreen";
import PickupLocations from "../screens/Buyer/PickupLocations";
import MapPickerScreen from "../screens/Buyer/MapPickerScreen";
import AddressSearchScreen from "../screens/Buyer/AddressSearchScreen";
import SearchResults from "../screens/Buyer/SearchResults";
import EditProfileScreen from "../screens/EditProfileScreen";
import ProductDetailScreen from "../screens/Buyer/ProductDetailScreen";
import AddProfileScreen from "../screens/Farmer/AddProfileScreen";
import FarmerVerificationScreen from "../screens/Farmer/FarmerVerificationScreen";
// Đặt Trước
import CartPreOrderScreen from "../screens/Buyer/CartPreOrderScreen";
import BuyerPreOrderDetailScreen from "../screens/Buyer/BuyerPreOrderDetailScreen";
import CheckoutPreOrderScreen from "../screens/Buyer/CheckoutPreOrderScreen";
import MyPreOrderScreen from "../screens/Buyer/MyPreOrderScreen";
import PreOrderDetailScreen from "../screens/Buyer/PreOrderDetailScreen";
import CancelPreOrderScreen from "../screens/Buyer/CancelPreOrderScreen";
// Quản Lý Nông Sản
import OrderManagementScreen from "../screens/Farmer/OrderManagementScreen";
import ProductScreen from "../screens/Farmer/ProductScreen";
import AddProductScreen from "../screens/Farmer/AddProductScreen";
import EditProductScreen from "../screens/Farmer/EditProductScreen";
// Quản Lý Đặt Trước
import PreOrderManagementScreen from "../screens/Farmer/PreOrderManagementScreen";
import PreOrderScreen from "../screens/Farmer/PreOrderScreen";
import AddPreOrderScreen from "../screens/Farmer/AddPreOrderScreen";
import EditPreOrderScreen from "../screens/Farmer/EditPreOrderScreen";
// Trang Admin
import AdminScreen from "../screens/Admin/AdminScreen";
import UserManagementScreen from "../screens/Admin/UserManagementScreen";
import SliderManagementScreen from "../screens/Admin/SliderManagementScreen";
import AddSliderScreen from "../screens/Admin/AddSliderScreen";
import VerifyFarmerScreen from "../screens/Admin/VerifyFarmerScreen";
import VerifyFarmerDetailScreen from "../screens/Admin/VerifyFarmerDetailScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AuthFlow" component={AuthNavigator} options={{ headerShown: false }} />
        {/* === CÁC MÀN HÌNH CHUNG === */}
        <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ChatDetail" component={ChatDetailScreen} options={{ headerShown: false }} /> 
        <Stack.Screen name="Cart" component={CartScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ShippingMethod" component={ShippingMethodScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PaymentMethod" component={PaymentMethodScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Address" component={AddressScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AddAddress" component={AddAddressScreen} options={{ headerShown: false }} />
        <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} options={{ headerShown: false }} />
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CancelOrder" component={CancelOrderScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CancelSuccess" component={CancelSuccessScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MyOrder" component={MyOrderScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ListReview" component={ReviewScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Review" component={WritingReviewScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Notification" component={NotificationsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CategoryProducts" component={CategoryProductsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PickupLocation" component={PickupLocations} options={{ headerShown: false }} />
        <Stack.Screen name="MapPicker" component={MapPickerScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AddressSearch" component={AddressSearchScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SearchResult" component={SearchResults} options={{ headerShown: false }} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ headerShown: false }} />
        <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} options={{ headerShown: false }} />
        {/* === Xác Thực Nông Dân === */}
        <Stack.Screen name="AddProfile" component={AddProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name="FarmerVerification" component={FarmerVerificationScreen} options={{ headerShown: false }} />
        {/* === Người Mua Đặt Trước === */}
        <Stack.Screen name="BuyerPreOrderDetail" component={BuyerPreOrderDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CartPreOrder" component={CartPreOrderScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CheckoutPreOrder" component={CheckoutPreOrderScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MyPreOrder" component={MyPreOrderScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PreOrderDetail" component={PreOrderDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CancelPreOrder" component={CancelPreOrderScreen} options={{ headerShown: false }} />
        {/* === QL Nông Sản === */}
        <Stack.Screen name="Product" component={ProductScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AddProduct" component={AddProductScreen} options={{ title: "THÊM SẢN PHẨM", headerTitleAlign: "center" }} />
        <Stack.Screen name="EditProduct" component={EditProductScreen} options={{ title: "SỬA SẢN PHẨM", headerTitleAlign: "center" }} />
        <Stack.Screen name="OrderManagement" component={OrderManagementScreen} options={{ headerShown: false }} />
        {/* === QL Đặt Trước === */}
        <Stack.Screen name="PreOrder" component={PreOrderScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AddPreOrder" component={AddPreOrderScreen} options={{ headerShown: false }} />
        <Stack.Screen name="EditPreOrder" component={EditPreOrderScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PreOrderManagement" component={PreOrderManagementScreen} options={{ headerShown: false }} />
        {/* === Trang Admin === */}
        <Stack.Screen name="UserManagement" component={UserManagementScreen} options={{ headerShown: false }} />
        <Stack.Screen name="VerifyFarmer" component={VerifyFarmerScreen} options={{ headerShown: false }} />
        <Stack.Screen name="VerifyFarmerDetail" component={VerifyFarmerDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SliderManagement" component={SliderManagementScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AddSlider" component={AddSliderScreen} options={{ headerShown: false }} />
        {/* === Home Theo Vai Trò === */}
        <Stack.Screen name="HomeBuyer" component={HomeBuyerTabs} options={{ headerShown: false }} />
        <Stack.Screen name="HomeFarmer" component={HomeFarmerTabs} options={{ headerShown: false }} />
        <Stack.Screen name="Admin" component={AdminScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}