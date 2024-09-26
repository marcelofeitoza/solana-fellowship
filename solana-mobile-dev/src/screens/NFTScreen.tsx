import React, { useEffect, useState } from "react";
import {
	ScrollView,
	StyleSheet,
	Text,
	ActivityIndicator,
	Linking,
} from "react-native";
import { CLUSTER, useAuthorization } from "../utils/useAuthorization";
import { useConnection } from "../utils/ConnectionProvider";
import { PublicKey } from "@solana/web3.js";
import { useGetTokenAccounts } from "../components/account/account-data-access";
import { DataTable, Button } from "react-native-paper";

export function NFTScreen() {
	const { selectedAccount } = useAuthorization();
	const { connection } = useConnection();
	const [nfts, setNfts] = useState<any[]>([]);
	const [loading, setLoading] = useState<boolean>(true);

	const getNFTs = async (address: PublicKey) => {
		try {
			// Fetch NFTs logic here
			// Example: const fetchedNFTs = await fetchNFTs(address);
			// setNfts(fetchedNFTs);
			setLoading(false);
		} catch (error) {
			console.error("Failed to fetch NFTs", error);
			setLoading(false);
		}
	};

	useEffect(() => {
		if (selectedAccount && connection) {
			getNFTs(selectedAccount.publicKey);
		}
	}, [selectedAccount, connection]);

	if (!selectedAccount) {
		return null;
	}

	let query = useGetTokenAccounts({ address: selectedAccount.publicKey });
	console.log(query);

	const openExplorer = (pubkey: string) => {
		const url = `https://explorer.solana.com/address/${pubkey}?cluster=${CLUSTER}`;
		Linking.openURL(url);
	};

	return (
		<ScrollView style={styles.screenContainer}>
			{loading ? (
				<ActivityIndicator size="large" color="purple" />
			) : nfts?.length > 0 ? (
				<Text>abc</Text>
			) : (
				<Text style={styles.noNftsText}>No NFTs found</Text>
			)}

			<DataTable>
				<DataTable.Header>
					<DataTable.Title>Public Key</DataTable.Title>
					<DataTable.Title>Explorer</DataTable.Title>
				</DataTable.Header>

				{query.data?.map((item, index) => (
					<DataTable.Row key={index}>
						<DataTable.Cell>
							{item.pubkey.toString()}
						</DataTable.Cell>
						<DataTable.Cell>
							<Button
								mode="contained"
								onPress={() => {
									console.log(
										"pubkey",
										item.pubkey.toString()
									);
									openExplorer(item.pubkey.toString());
								}}
							>
								View
							</Button>
						</DataTable.Cell>
					</DataTable.Row>
				))}
			</DataTable>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	screenContainer: {
		paddingHorizontal: 16,
		paddingVertical: 32,
		flex: 1,
	},
	nftContainer: {
		marginBottom: 24,
		alignItems: "center",
	},
	nftImage: {
		width: 200,
		height: 200,
		borderRadius: 8,
	},
	nftTitle: {
		marginTop: 8,
		fontSize: 18,
		fontWeight: "bold",
		color: "white",
	},
	nftDescription: {
		marginTop: 4,
		fontSize: 14,
		color: "white",
		textAlign: "center",
	},
	noNftsText: {
		textAlign: "center",
		marginTop: 50,
		fontSize: 18,
		color: "gray",
	},
});
