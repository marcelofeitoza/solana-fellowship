import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { encodeURL, findReference, validateTransfer } from "@solana/pay";
import BigNumber from "bignumber.js";

const myWallet = process.env.NEXT_PUBLIC_SOLANA_WALLET_ADDRESS;
if (!myWallet) {
	throw new Error("Missing NEXT_PUBLIC_SOLANA_WALLET_ADDRESS");
}
const recipient = new PublicKey(myWallet);
const label = "DeVolt - Car Charge";
const memo = "Car charge";
const kWPrice = new BigNumber(0.0001); // 0.0001 SOL

const paymentRequests = new Map<
	string,
	{ recipient: PublicKey; amount: BigNumber; memo: string }
>();

export async function POST(request: Request) {
	try {
		const { kwAmount } = await request.json();
		const amount = kWPrice.multipliedBy(kwAmount);
		const reference = new Keypair().publicKey;
		const message = `DeVolt - Car charge of ${amount} kW at ${new Date().toDateString()}`;
		const urlData = await generateUrl(
			recipient,
			amount,
			reference,
			label,
			message,
			memo
		);
		const ref = reference.toBase58();
		paymentRequests.set(ref, { recipient, amount, memo });
		const { url } = urlData;
		return Response.json({ url, ref });
	} catch (error) {
		console.error("Error:", error);
		return Response.json({ error: "Internal Server Error" });
	}
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const reference = searchParams.get("reference");
	if (!reference) {
		return Response.json({ error: "Reference not found" });
	}

	try {
		const referencePublicKey = new PublicKey(reference);
		const response = await verifyTransaction(referencePublicKey);
		if (response) {
			return Response.json({ status: "verified" });
		} else {
			return Response.json({ status: "not found" });
		}
	} catch (error) {
		console.error("Error:", error);
		return Response.json({ error: "Internal Server Error" });
	}
}

async function generateUrl(
	recipient: PublicKey,
	amount: BigNumber,
	reference: PublicKey,
	label: string,
	message: string,
	memo: string
) {
	const url: URL = encodeURL({
		recipient,
		amount,
		reference,
		label,
		message,
		memo,
	});
	return { url };
}

async function verifyTransaction(reference: PublicKey) {
	const paymentData = paymentRequests.get(reference.toBase58());
	if (!paymentData) {
		throw new Error("Payment request not found");
	}
	const { recipient, amount, memo } = paymentData;
	
	const connection = new Connection(
		"https://api.devnet.solana.com",
		"confirmed"
	);

	const found = await findReference(connection, reference);
	console.log(found.signature);

	const response = await validateTransfer(
		connection,
		found.signature,
		{
			recipient,
			amount,
			splToken: undefined,
			reference,
			//memo
		},
		{ commitment: "confirmed" }
	);

	if (response) {
		paymentRequests.delete(reference.toBase58());
	}
	return response;
}
