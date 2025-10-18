import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../screens/HomeScreen";
import ChatScreen from "../screens/ChatScreen";
import MapScreen from "../screens/MapScreen";
import CartScreen from "../screens/CartScreen";
import AuthNavigator from "./AuthNavigator";
import ProfileScreen from "../screens/ProfileScreen";
import HomeBuyer from "../screens/HomeBuyer";
import HomeFarmer from "../screens/HomeFarmer";
import HomeTrader from "../screens/HomeTrader";
import AddProductScreen from "../screens/AddProductScreen";
import HomeTabs from "./HomeTabs";
import MarketplaceScreen from "../screens/MarketplaceScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="AuthFlow">
        <Stack.Screen name="AuthFlow" component={AuthNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Map" component={MapScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Cart" component={CartScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Marketplace" component={MarketplaceScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="AddProduct"
          component={AddProductScreen}
          options={{ title: "Thêm sản phẩm" }}
        />
        {/* Home theo vai trò */}
        <Stack.Screen
          name="HomeBuyer"
          component={HomeBuyer}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="HomeFarmer"
          component={HomeTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="HomeTrader"
          component={HomeTrader}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
