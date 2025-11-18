import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SplashScreen from "../screens/SplashScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import AuthNavigator from "./AuthNavigator";
import ChatScreen from "../screens/ChatScreen";
import CartScreen from "../screens/CartScreen";
import ShippingMethodScreen from "../screens/ShippingMethodScreen";
import PaymentMethodScreen from "../screens/PaymentMethodScreen";
import AddressScreen from "../screens/AddressScreen";
import AddAddressScreen from "../screens/AddAddressScreen";
import OrderSuccessScreen from "../screens/OrderSuccessScreen";
import OrderDetailScreen from "../screens/OrderDetailScreen";
import CancelOrderScreen from "../screens/CancelOrderScreen";
import CancelSuccessScreen from "../screens/CancelSuccessScreen";
import CheckoutScreen from "../screens/CheckoutScreen";
import WritingReviewScreen from "../screens/WritingReviewScreen";
import MyOrderScreen from "../screens/MyOrderScreen";
import ReviewScreen from "../screens/ReviewScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import HomeFarmerTabs from "./HomeFarmerTabs";
import HomeBuyerTabs from "./HomeBuyerTabs";
import ProductScreen from "../screens/Farmer/ProductScreen";
import AddProductScreen from "../screens/Farmer/AddProductScreen";
import EditProductScreen from "../screens/Farmer/EditProductScreen";
import ProductDetailScreen from "../screens/Farmer/ProductDetailScreen";
import OrderManagementScreen from "../screens/Farmer/OrderManagementScreen";
import CategoryProductsScreen from "../screens/CategoryProductsScreen";
import PickupLocations from "../screens/Buyer/PickupLocations";
import MapPickerScreen from "../screens/Buyer/MapPickerScreen";
import AddressSearchScreen from "../screens/Buyer/AddressSearchScreen";
import SearchResults from "../screens/Buyer/SearchResults";

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
        <Stack.Screen name="Product" component={ProductScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AddProduct" component={AddProductScreen} options={{ title: "THÊM SẢN PHẨM", headerTitleAlign: "center" }} />
        <Stack.Screen name="EditProduct" component={EditProductScreen} options={{ title: "SỬA SẢN PHẨM", headerTitleAlign: "center" }} />
        <Stack.Screen name="CategoryProducts" component={CategoryProductsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="OrderManagement" component={OrderManagementScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PickupLocation" component={PickupLocations} options={{ headerShown: false }} />
        <Stack.Screen name="MapPicker" component={MapPickerScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AddressSearch" component={AddressSearchScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SearchResult" component={SearchResults} options={{ headerShown: false }} />
        {/* === HOME THEO VAI TRÒ === */}
        <Stack.Screen name="HomeBuyer" component={HomeBuyerTabs} options={{ headerShown: false }} />
        <Stack.Screen name="HomeFarmer" component={HomeFarmerTabs} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}