import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ChatScreen from "../screens/ChatScreen";
import MapScreen from "../screens/MapScreen";
import CartScreen from "../screens/CartScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import AuthNavigator from "./AuthNavigator";
import HomeFarmerTabs from "./HomeFarmerTabs";
import HomeBuyerTabs from "./HomeBuyerTabs";
import ProductScreen from "../screens/Farmer/ProductScreen";
import AddProductScreen from "../screens/Farmer/AddProductScreen";
import EditProductScreen from "../screens/Farmer/EditProductScreen";
import ProductDetailScreen from "../screens/Farmer/ProductDetailScreen";
import CategoryProductsScreen from "../screens/CategoryProductsScreen";
import PickupLocations from "../screens/Buyer/PickupLocations";
import MapPickerScreen from "../screens/Buyer/MapPickerScreen";
import AddressSearchScreen from "../screens/Buyer/AddressSearchScreen";
import SearchResults from "../screens/Buyer/SearchResults";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="AuthFlow">
        <Stack.Screen name="AuthFlow" component={AuthNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Map" component={MapScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Cart" component={CartScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Notification" component={NotificationsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Product" component={ProductScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AddProduct" component={AddProductScreen} options={{ title: "THÊM SẢN PHẨM", headerTitleAlign: "center" }} />
        <Stack.Screen name="EditProduct" component={EditProductScreen} options={{ title: "SỬA SẢN PHẨM", headerTitleAlign: "center" }}/>
        <Stack.Screen name="CategoryProducts" component={CategoryProductsScreen} options={{ headerShown: false }} />
        {/* Map */}
        <Stack.Screen name="PickupLocation" component={PickupLocations} options={{ headerShown: false }} />
        <Stack.Screen name="MapPicker" component={MapPickerScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AddressSearch" component={AddressSearchScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SearchResult" component={SearchResults} options={{ headerShown: false }} />
        {/* Home theo vai trò */}
        <Stack.Screen name="HomeBuyer" component={HomeBuyerTabs} options={{ headerShown: false }} />
        <Stack.Screen name="HomeFarmer" component={HomeFarmerTabs} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
