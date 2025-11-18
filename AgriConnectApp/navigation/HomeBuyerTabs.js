import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/Ionicons";
import HomeBuyer from "../screens/Buyer/HomeBuyer";
import PreorderScreen from "../screens/Buyer/PreorderScreen";
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
          else if (route.name === "Preorder") iconName = "time-outline";
          else if (route.name === "Notification") iconName = "notifications-outline";
          else if (route.name === "Profile") iconName = "person-outline";
          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeBuyer} options={{ title: "Trang chủ" }} />
      <Tab.Screen name="Preorder" component={PreorderScreen} options={{ title: "Đặt trước" }} />
      <Tab.Screen name="Notification" component={NotificationsScreen} options={{ title: "Thông báo" }} />
      <Tab.Screen name="Profile" component={BuyerProfileScreen} options={{ title: "Tôi" }} />
    </Tab.Navigator>
  );
};

export default HomeBuyerTabs;