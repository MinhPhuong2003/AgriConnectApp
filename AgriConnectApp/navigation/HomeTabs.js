import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/Ionicons";
import HomeFarmer from "../screens/HomeFarmer";
import Marketplace from "../screens/MarketplaceScreen";

const Tab = createBottomTabNavigator();

const HomeTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#4CAF50",
        tabBarInactiveTintColor: "#777",
        tabBarIcon: ({ color, size }) => {
          let iconName = "";
          if (route.name === "MyProducts") iconName = "leaf-outline";
          else if (route.name === "Marketplace") iconName = "storefront-outline";
          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="MyProducts"
        component={HomeFarmer}
        options={{ title: "Sản phẩm của tôi" }}
      />
      <Tab.Screen
        name="Marketplace"
        component={Marketplace}
        options={{ title: "Marketplace" }}
      />
    </Tab.Navigator>
  );
};

export default HomeTabs;
