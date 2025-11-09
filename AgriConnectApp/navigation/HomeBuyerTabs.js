import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/Ionicons";
import HomeBuyer from "../screens/Buyer/HomeBuyer";
import MapScreen from "../screens/MapScreen";
import CartScreen from "../screens/CartScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import BuyerProfileScreen from "../screens/Buyer/BuyerProfileScreen";

const Tab = createBottomTabNavigator();

const HomeBuyerTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#2e7d32",
        tabBarInactiveTintColor: "#777",
        tabBarIcon: ({ color, size }) => {
          let iconName = "";
          if (route.name === "Home") iconName = "home-outline";
          else if (route.name === "Notification") iconName = "notifications-outline";
          else if (route.name === "Map") iconName = "location-outline";
          else if (route.name === "Cart") iconName = "cart-outline";
          else if (route.name === "Profile") iconName = "person-outline";
          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeBuyer} options={{ title: "Trang chủ" }} />
      <Tab.Screen name="Notification" component={NotificationsScreen} options={{ title: "Thông báo" }} />
      <Tab.Screen name="Map" component={MapScreen} options={{ title: "Bản đồ" }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ title: "Giỏ hàng" }} />
      <Tab.Screen name="Profile" component={BuyerProfileScreen} options={{ title: "Hồ sơ" }} />
    </Tab.Navigator>
  );
};

export default HomeBuyerTabs;