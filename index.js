import inquirer from "inquirer";
import { table } from "table";
import { readFile } from "fs/promises";
const { version } = JSON.parse(await readFile(new URL("./package.json", import.meta.url)));

const info = {};
let judul;
let total_jajan = 0;
let total_penambahan = 0;
let total_pengurangan = 0;
let grand_total = 0;

async function renderMenuUtama() {
	const menu_utama = [
		{
			type: "list",
			name: "aksi",
			message: "Pilih mau ngapain:",
			choices: ["Input jajaner", "Input penambahan", "Input pengurangan", "Input judul", new inquirer.Separator(), "Reset", "Bye-bye"]
		}
	];

	const menu = await inquirer.prompt(menu_utama);

	if (menu.aksi === "Input jajaner") await tampilkanFormMenu("jajaners");
	if (menu.aksi === "Input penambahan") await tampilkanFormMenu("penambahan");
	if (menu.aksi === "Input pengurangan") await tampilkanFormMenu("pengurangan");
	if (menu.aksi === "Input judul") await tampilkanFormJudul();
	if (menu.aksi === "Reset") initUlang();
	if (menu.aksi === "Bye-bye") process.exit();

	await repeat();
}

function initUlang() {
	judul = "";
	info.jajaners = [];
	info.penambahan = [];
	info.pengurangan = [];
}

function recalculate() {
	total_jajan = info.jajaners.reduce((prev, curr) => prev + curr.nominal, 0);
	total_penambahan = info.penambahan.reduce((prev, curr) => prev + curr.nominal, 0);
	total_pengurangan = info.pengurangan.reduce((prev, curr) => prev + curr.nominal, 0);
	grand_total = total_jajan + total_penambahan - total_pengurangan;
}

function renderOutput() {
	const header = [["Nama", "Jajannya", "Rasio", "Bayarnya"]];

	const config = {
		columnDefault: {
			width: 10
		},
		columns: [{ alignment: "left" }, { alignment: "right", width: 15 }, { alignment: "right", width: 7 }, { alignment: "right", width: 15 }],
		header: {
			alignment: "center",
			content: judul || "Jajaners"
		}
	};

	//mapping table
	const data = info.jajaners.map(x => {
		const ratio = x.nominal / total_jajan;
		return [x.nama, formatMataUang(x.nominal), ratio.toFixed(2), formatMataUang(ratio * grand_total)];
	});

	//output table dan footer
	console.log(table([...header, ...data], config));
	console.log("Total jajan: ", total_jajan);
	console.log("Total penambahan: ", total_penambahan);
	console.log("Total pengurangan: ", total_pengurangan);
	console.log("Grand total: ", grand_total);
	console.log("");
}

async function repeat() {
	console.clear();
	recalculate();
	if (info.jajaners?.length) renderOutput();
	await renderMenuUtama();
}

async function tampilkanFormMenu(variable) {
	const questions = [
		{
			type: "input",
			name: "nama",
			message: "Nama",
			validate(value) {
				return value ? true : "Diperlukan";
			}
		},
		{
			type: "input",
			name: "nominal",
			message: "Nominal jajan",
			validate(value) {
				const pass = value.match(/^\d+$/);
				return pass && pass > 0 ? true : "Diperlukan dengan format angka";
			}
		}
	];

	const hasil = await inquirer.prompt(questions);
	hasil.nominal = +hasil.nominal;
	info[variable].push(hasil);
}

async function tampilkanFormJudul() {
	const questions = [
		{
			type: "input",
			name: "judul",
			message: "Judul table",
			validate(value) {
				return value ? true : "Diperlukan";
			}
		}
	];

	const hasil = await inquirer.prompt(questions);
	judul = hasil.judul;
}

//format rupiah
function formatMataUang(number) {
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR"
	}).format(number.toFixed(2));
}

//execute
(async () => {
	console.log(`Selamat datang di Jajaners v${version}`);
	initUlang();
	await renderMenuUtama();
})();
