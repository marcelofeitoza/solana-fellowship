import React, { useRef, useState } from "react";
import {
	Button,
	Image,
	ScrollView,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { Icon, Text } from "react-native-paper";
import * as Location from "expo-location";

import { Section } from "../Section";
import {
	Camera,
	CameraView,
	CameraType,
	useCameraPermissions,
} from "expo-camera";
import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";

export function NFTScreen() {
	

	return (
		<ScrollView style={styles.screenContainer}>
			
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	screenContainer: {
		paddingHorizontal: 16,
		paddingVertical: 32,
		flex: 1,
	},
	buttonGroup: {
		flexDirection: "column",
		paddingVertical: 4,
		marginBottom: 16,
	},
	camera: {
		display: "flex",
		height: 500,
		width: "100%",
	},
	buttonContainer: {
		flex: 1,
		backgroundColor: "transparent",
		flexDirection: "row",
		margin: 20,
		justifyContent: "space-between",
	},
	button: {
		backgroundColor: "rgba(0, 0, 0, 0.5)",
		padding: 16,
		borderRadius: 8,
		alignSelf: "flex-end",
		alignItems: "center",
	},
	buttonRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		gap: 10,
		alignContent: "center",
		alignItems: "center",
		marginBottom: 16,
	},
	trashButton: {
		backgroundColor: "black",
		position: "absolute",
		padding: 8,
		opacity: 0.5,
		borderRadius: 8,
		alignSelf: "flex-end",
		alignItems: "center",
		top: 16,
		right: 16,
	},
	text: {
		fontSize: 18,
		color: "white",
	},
	input: {
		height: 40,
		borderColor: "gray",
		color: "white",
		borderWidth: 1,
		marginBottom: 12,
		padding: 8,
		flex: 1,
	},
});
