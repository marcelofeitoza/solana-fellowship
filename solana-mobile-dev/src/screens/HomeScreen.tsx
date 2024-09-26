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
import { Camera } from "expo-camera"; // Import Camera from expo-camera

import { Section } from "../Section";
import { useAuthorization } from "../utils/useAuthorization"; // Removed CLUSTER
import { AccountDetailFeature } from "../components/account/account-detail-feature";
import { SignInFeature } from "../components/sign-in/sign-in-feature";
import { CameraType, useCameraPermissions, CameraView } from "expo-camera";
import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import {
	getCurrentPositionAsync,
	requestForegroundPermissionsAsync,
} from "expo-location";
import {
	createAssociatedTokenAccountInstruction,
	createInitializeMintInstruction,
	createMintToInstruction,
	getAssociatedTokenAddress,
	MINT_SIZE,
	TOKEN_PROGRAM_ID,
} from "@solana/spl-token"; // Updated imports
import { useMobileWallet } from "../utils/useMobileWallet";
import axios from "axios";
import { useConnection } from "../utils/ConnectionProvider";
import {
	Keypair,
	SystemProgram,
	TransactionInstruction,
	TransactionMessage,
	VersionedTransaction,
} from "@solana/web3.js";

export function HomeScreen() {
	const { selectedAccount } = useAuthorization();
	const { signAndSendTransaction } = useMobileWallet();
	const { connection } = useConnection();

	const [isLoading, setIsLoading] = useState(false);
	const [facing, setFacing] = useState<CameraType>("back");
	const [permission, requestPermission] = useCameraPermissions();
	const [image, setImage] = useState<string | null>(null);
	const [imageBase64, setImageBase64] = useState<string | null>(null);

	const cameraRef = useRef<Camera | null>(null); // Ensure correct type for cameraRef
	const [formData, setFormData] = useState({
		name: "My NFT",
		description:
			"This is my NFT Minting project from the Solana Summer Fellowship 2024",
		location: "",
	});

	const PINATA_JWT =
		"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI2NWQyYmQ5Ny1mMzc5LTRlNDUtYjc4Ni0zMTNmOGU0NWMyNDkiLCJlbWFpbCI6Im1hcmNlbG9vdzE0N0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiMGMzMGJkMjYzNTg5ZjBkMTE1YTIiLCJzY29wZWRLZXlTZWNyZXQiOiI0N2RiYzRjMjZjNGZiNjk1YjEzNTUzYjY1YTk0MGQwMjNhMWJlZTY2YTI5MGExYWYzNzE2MTNiNTIwYjU2YTllIiwiZXhwIjoxNzU4ODgwNzQzfQ.YdQ9GYdT5wGiC_qkPPRSqVYV9wNImUOvdLSOa_DjgoA";

	const uploadImageToIPFS = async (base64: string) => {
		try {
			const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";

			const data = new FormData();
			data.append("file", {
				uri: `data:image/png;base64,${base64}`,
				name: "image.png",
				type: "image/png",
			} as any); // Adicione 'as any' para evitar erros de tipo

			const response = await fetch(url, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${PINATA_JWT}`,
					"Content-Type": "multipart/form-data",
				},
				body: data,
			});

			const responseJson = await response.json();

			if (responseJson.IpfsHash) {
				return responseJson.IpfsHash;
			} else {
				throw new Error("Falha ao fazer upload da imagem para o IPFS");
			}
		} catch (error) {
			console.error("Erro ao fazer upload da imagem para o IPFS:", error);
			throw error;
		}
	};

	const uploadJSONToIPFS = async (json: string) => {
		const options = {
			method: "POST",
			url: "https://api.pinata.cloud/pinning/pinJSONToIPFS",
			headers: {
				Authorization: "Bearer " + PINATA_JWT,
				"Content-Type": "application/json",
			},
			data: json,
		};

		axios
			.request(options)
			.then(function (response) {
				console.log(response.data);
			})
			.catch(function (error) {
				console.error(error);
			});
	};

	const toggleCameraFacing = () => {
		setFacing((prev) => (prev === "back" ? "front" : "back"));
	};

	const takePicture = async () => {
		if (cameraRef.current) {
			const photo = await cameraRef.current.takePictureAsync({
				quality: 1,
				base64: true, // Adicione esta linha
			});
			setImage(photo.uri);
			setImageBase64(photo.base64);
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

	const mintNft = async () => {
		setIsLoading(true);
		if (!selectedAccount) {
			alert("Please connect your wallet first.");
			setIsLoading(false);
			return;
		}

		if (!imageBase64) {
			alert("Please take a picture first.");
			setIsLoading(false);
			return;
		}

		try {
			// Upload da imagem para o IPFS
			const imageCid = await uploadImageToIPFS(imageBase64);
			const imageUri = `ipfs://${imageCid}`;

			// Criação dos metadados
			const metadata = {
				name: formData.name,
				description: formData.description,
				image: imageUri,
				attributes: [
					{
						trait_type: "Location",
						value: formData.location,
					},
				],
			};

			// Upload dos metadados para o IPFS
			const metadataCid = await uploadJSONToIPFS(
				JSON.stringify(metadata)
			);
			const metadataUri = `ipfs://${metadataCid}`;

			// Mint do NFT na Solana
			await mintToken(metadataUri);
		} catch (error) {
			console.error("Erro ao mintar NFT:", error);
			alert("Erro ao mintar NFT. Veja o console para mais detalhes.");
		}

		setIsLoading(false);
	};

	const mintToken = async (metadataUri: string) => {
		if (!selectedAccount) {
			alert("Please connect your wallet first.");
			return;
		}

		console.log("connection", connection.rpcEndpoint);

		try {
			// Generate a new mint keypair
			const mintKeypair = Keypair.generate();
			const mintPubkey = mintKeypair.publicKey;

			// Get associated token account address for the user
			const tokenAccountAddress = await getAssociatedTokenAddress(
				mintPubkey,
				selectedAccount.publicKey
			);

			// Get minimum balance for rent exemption
			const lamportsForMint =
				await connection.getMinimumBalanceForRentExemption(MINT_SIZE);

			// Construct instructions
			const instructions: TransactionInstruction[] = [];

			// 1. Create the mint account
			instructions.push(
				SystemProgram.createAccount({
					fromPubkey: selectedAccount.publicKey,
					newAccountPubkey: mintPubkey,
					space: MINT_SIZE,
					lamports: lamportsForMint,
					programId: TOKEN_PROGRAM_ID,
				})
			);

			// 2. Initialize the mint
			instructions.push(
				createInitializeMintInstruction(
					mintPubkey,
					0, // decimals
					selectedAccount.publicKey, // mint authority
					selectedAccount.publicKey // freeze authority
				)
			);

			// 3. Create the associated token account
			instructions.push(
				createAssociatedTokenAccountInstruction(
					selectedAccount.publicKey,
					tokenAccountAddress,
					selectedAccount.publicKey,
					mintPubkey
				)
			);

			// 4. Mint tokens to the user's associated token account
			instructions.push(
				createMintToInstruction(
					mintPubkey,
					tokenAccountAddress,
					selectedAccount.publicKey,
					1 // amount
				)
			);

			// Create the transaction message
			const { blockhash } = await connection.getLatestBlockhash();
			const messageV0 = new TransactionMessage({
				payerKey: selectedAccount.publicKey,
				recentBlockhash: blockhash,
				instructions,
			}).compileToV0Message();

			const transaction = new VersionedTransaction(messageV0);

			// Sign the transaction with the mint keypair
			transaction.sign([mintKeypair]);

			// Send the transaction for signing and sending
			const signature = await signAndSendTransaction(transaction);

			console.log("Mint NFT signature", signature);
			alert("NFT minted successfully!");
		} catch (error) {
			console.error("Error minting NFT:", error);
			alert("Error minting NFT. See console for details.");
		}
	};

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
					numberOfLines={4}
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
					<TouchableOpacity style={styles.button} onPress={mintNft}>
						<Text style={styles.text}>
							{isLoading ? "Working..." : "Mint NFT"}
						</Text>
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
