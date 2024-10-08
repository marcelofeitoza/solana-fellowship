import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import { TopBar } from "../components/top-bar/top-bar-feature";
import { HomeScreen } from "../screens/HomeScreen";
import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "react-native-paper";
import { NFTScreen } from "../screens/NFTScreen";

const Tab = createBottomTabNavigator();

/**
 * This is the main navigator with a bottom tab bar.
 * Each tab is a stack navigator with its own set of screens.
 *
 * More info: https://reactnavigation.org/docs/bottom-tab-navigator/
 */
export function HomeNavigator() {
	const theme = useTheme();
	return (
		<Tab.Navigator
			screenOptions={({ route }) => ({
				header: () => <TopBar />,
				tabBarIcon: ({ focused, color, size }) => {
					switch (route.name) {
						case "Home":
							return (
								<MaterialCommunityIcon
									name={focused ? "home" : "home-outline"}
									size={size}
									color={color}
								/>
							);
						case "NFT":
							return (
								<MaterialCommunityIcon
									name={focused ? "cards" : "cards-outline"}
									size={size}
									color={color}
								/>
							);
						default:
							return (
								<MaterialCommunityIcon
									name={focused ? "home" : "home-outline"}
									size={size}
									color={color}
								/>
							);
					}
				},
			})}
		>
			<Tab.Screen name="Home" component={HomeScreen} />
			<Tab.Screen name="NFT" component={NFTScreen} />
		</Tab.Navigator>
	);
}
