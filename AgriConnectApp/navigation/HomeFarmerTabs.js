import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/Ionicons";
import HomeFarmer from "../screens/Farmer/HomeFarmer";
import ChatScreen from "../screens/ChatScreen";
import PreOrderScreen from "../screens/Farmer/PreOrderScreen";
import ProductScreen from "../screens/Farmer/ProductScreen";
import FarmerProfileScreen from "../screens/Farmer/FarmerProfileScreen";

const Tab = createBottomTabNavigator();

const HomeFarmerTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#4CAF50",
        tabBarInactiveTintColor: "#777",
        tabBarIcon: ({ color, size }) => {
          let iconName = "";
          switch (route.name) {
            case "Dashboard":
              iconName = "home-outline";
              break;
            case "MyProducts":
              iconName = "leaf-outline";
              break;
            case "Chat":
              iconName = "chatbubble-ellipses-outline";
              break;  
            case "PreOrder":
              iconName = "calendar-outline";
              break;
            case "Profile":
              iconName = "person-outline";
              break;
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      {/* Trang chính của nông dân */}
      <Tab.Screen
        name="Dashboard"
        component={HomeFarmer}
        options={{ title: "Trang chủ" }}
      />

      {/* Danh sách sản phẩm của nông dân */}
      <Tab.Screen
        name="MyProducts"
        component={ProductScreen}
        options={{ title: "Sản phẩm" }}
      />

      {/* Chat với người mua */}
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{ title: "Trò chuyện" }}
      />

      {/* Đặt trước */}
      <Tab.Screen
        name="PreOrder"
        component={PreOrderScreen}
        options={{ title: "Đặt trước" }}
      />

      {/* Hồ sơ nông dân */}
      <Tab.Screen
        name="Profile"
        component={FarmerProfileScreen}
        options={{ title: "Tôi" }}
      />
    </Tab.Navigator>
  );
};

export default HomeFarmerTabs;
