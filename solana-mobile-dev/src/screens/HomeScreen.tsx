import React, { useEffect, useRef, useState } from "react";
import {
	StyleSheet,
	TextInput,
	TouchableOpacity,
	View,
	Image,
	ScrollView,
} from "react-native";
import { Button, Text } from "react-native-paper";

import { Section } from "../Section";
import { useAuthorization } from "../utils/useAuthorization";
import { AccountDetailFeature } from "../components/account/account-detail-feature";
import { SignInFeature } from "../components/sign-in/sign-in-feature";
import { CameraType, useCameraPermissions, CameraView } from "expo-camera";
import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import {
	getCurrentPositionAsync,
	requestForegroundPermissionsAsync,
} from "expo-location";

export function HomeScreen() {
	const { selectedAccount } = useAuthorization();

	const [facing, setFacing] = useState<CameraType>("front");
	const [permission, requestPermission] = useCameraPermissions();
	const [image, setImage] = useState<string | null>(null);
	const cameraRef = useRef<Camera | null>(null);
	const [formData, setFormData] = useState({
		name: "My NFT",
		description:
			"This is my NFT Minting project from the Solana Summer Fellowship 2024",
		location: "",
	});

	const toggleCameraFacing = () => {
		setFacing((prev) => (prev === "back" ? "front" : "back"));
	};

	const takePicture = async () => {
		if (cameraRef.current) {
			const photo = await cameraRef.current.takePictureAsync({
				quality: 1,
			});
			setImage(photo.uri);
		}
	};

	const handleInputChange = (name: string, value: string) => {
		setFormData({ ...formData, [name]: value });
	};

	const handleRemoveImage = () => {
		setImage(null);
	};

	const getCoordinates = async () => {
		let { status } = await requestForegroundPermissionsAsync();
		if (status !== "granted") {
			alert("Permission to access location was denied");
			return;
		}

		let location = await getCurrentPositionAsync({});
		setFormData({
			...formData,
			location: `${location.coords.latitude}, ${location.coords.longitude}`,
		});
	};

	useEffect(() => {
		getCoordinates();
	}, []);

	return (
		<ScrollView style={styles.screenContainer}>
			<Text
				style={{ fontWeight: "bold", marginBottom: 12 }}
				variant="displaySmall"
			>
				Solana Mobile Expo Template
			</Text>

			{selectedAccount ? <AccountDetailFeature /> : <SignInFeature />}

			<Section title="NFT Minting">
				{/* Form */}
				<TextInput
					style={styles.input}
					placeholder="Name"
					placeholderTextColor={"gray"}
					value={formData.name}
					onChangeText={(text) => handleInputChange("name", text)}
				/>
				<TextInput
					style={styles.input}
					placeholder="Description"
					placeholderTextColor={"gray"}
					value={formData.description}
					onChangeText={(text) =>
						handleInputChange("description", text)
					}
				/>
				<View style={styles.buttonRow}>
					<TextInput
						style={{ ...styles.input, marginBottom: 0 }}
						placeholder="Location"
						placeholderTextColor={"gray"}
						value={formData.location}
						editable={false}
					/>
					<TouchableOpacity
						onPress={getCoordinates}
						style={{
							...styles.button,
							backgroundColor: "darkgreen",
							padding: 8,
							marginTop: 0,
							alignSelf: "center",
						}}
					>
						<Text style={styles.text}>Get Location</Text>
					</TouchableOpacity>
				</View>

				{permission?.granted ? (
					image ? (
						<View>
							<Image
								source={{ uri: image }}
								style={{ width: "100%", height: 500 }}
							/>
							<TouchableOpacity
								style={{
									...styles.trashButton,
								}}
								onPress={handleRemoveImage}
							>
								<Text style={styles.text}>
									<MaterialCommunityIcon
										name={"trash-can"}
										size={24}
										direction={"ltr"}
									/>
								</Text>
							</TouchableOpacity>
						</View>
					) : (
						<CameraView
							ref={cameraRef}
							style={styles.camera}
							facing={facing}
						>
							<View style={styles.buttonContainer}>
								<TouchableOpacity
									style={styles.button}
									onPress={toggleCameraFacing}
								>
									<Text style={styles.text}>Flip Camera</Text>
								</TouchableOpacity>

								<TouchableOpacity
									style={styles.button}
									onPress={takePicture}
								>
									<Text style={styles.text}>
										Take Picture
									</Text>
								</TouchableOpacity>
							</View>
						</CameraView>
					)
				) : (
					<View style={styles.buttonGroup}>
						<Button onPress={requestPermission}>
							<Text>Request Camera Permission</Text>
						</Button>
					</View>
				)}

				<View style={{ ...styles.buttonGroup, marginBottom: 16 }}>
					<TouchableOpacity
						style={styles.button}
						onPress={() => console.log(formData)}
					>
						<Text style={styles.text}>Mint NFT</Text>
					</TouchableOpacity>
				</View>
			</Section>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	screenContainer: {
		paddingHorizontal: 16,
		paddingVertical: 32,
		paddingBottom: 48,
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
