const delay = async (time) => {
    return new Promise(resolve => setTimeout(resolve, time));
};

const formatter = (id, data) => {
    const abs = ["username", "password", "email", "no tlp", "nama", "jenis bank", "bank", "rek"];
    let val = [];
    data = data.split("\n");
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < abs.length; j++) {
            if (data[i].split(":")[0].toLowerCase().includes(abs[j])) {
                val.push(data[i].split(":")[1].trim());
                break;
            }
        }
    }
    return [id, [val[0], val[1], val[2], val[3], val[4], val[5], val[6], val[7]]]
};

const register = async (myBot, page, data) => {
    let username = data[0];
    let password = data[1];
    let email = data[2];
    let no_tlp = data[3];
    let nama = data[4];
    let jenisBank = data[5];
    let bank = data[6];
    let rek = data[7];
    try {
        if (!username) {
            console.log("mohon mengisi username anda");
            return;
        }
        if (!password) {
            console.log("mohon mengisi password anda");
            return;
        }
        if (!email) {
            console.log("mohon mengisi email anda");
            return;
        }
        if (!no_tlp) {
            console.log("mohon mengisi nomor telepon anda");
            return;
        }
        if (!nama) {
            console.log("mohon mengisi nama anda");
            return;
        }
        if (!jenisBank) {
            console.log("mohon mengisi janis bank anda");
            return;
        }
        if (!bank) {
            console.log("mohon mengisi nama bank anda");
            return;
        }
        if (!rek) {
            console.log("mohon mengisi nomor rekening anda");
            return;
        }

        await page.goto(`${URL}/register`);
        await page.type('#user_name', username);//isi username
        await page.type('#password_1', password);// isi password
        await page.type('#password_confirm', password);// isi konfirmasi password
        await page.type('#email', email);// isi email
        await page.type('#mobile_no', no_tlp);// isi no telp
        await page.click("#register_form_two_next_btn > button");// tekan lanjut
        await page.waitForSelector("#register_form_two_submit_btn > button", {
            visible: true,
            timeout: 2000,
        }); // tunggu button daftar muncul
        await delay(500);

        await page.type('#name1', nama); // isi nama
        if (jenisBank.toLowerCase() === "wallet") {
            await page.click("#registerForm1 > div.register_form_two > div:nth-child(4) > div.col-md-7 > div > div:nth-child(2) > label > span.radio-title"); // pilih jenis bank
            await page.select("#ewalletOpts--register", bank.toUpperCase()); // isi bank
        } else {
            await page.select("#bankOpts--register", bank.toUpperCase()); // isi bank
        }
        await page.type("#acc_no", rek); // isi no rek
        await page.click("#registerForm1 > div.register_form_two > div.form-group.form-check.submit-box > div:nth-child(1) > div > label");// terms
        await page.click("#registerForm1 > div.register_form_two > div.form-group.form-check.submit-box > div:nth-child(2) > div > label");// ingat saya

        const element = await page.$("#registerForm1 > div.register_form_two > div.form-group.row.no-gutters > img");
        await element.screenshot({path: "src/image/test.png"});
        await myBot.sendPhoto(id, "src/image/test.png", {caption: "Isi CAPTCHA ini"}, {filename: "captcha.png"});
        return true;
    } catch (e) {
        await myBot.sendMessage(id, "Data yang dimasukkan salah, silahkan mengulangi registrasi!");
        return false;
    }
};

const verify = async (myBot, page, data) => {
    let id = data[0];
    let number = data[1];
    let username = data[2];
    let password = data[3];
    try {
        await page.type("#captcha", number);
        await page.click("#register_form_two_submit_btn > button");
        await page.waitForSelector("body > div.content.my01 > div > div > div > div.centered-container > a > button", {
            visible: true,
            timeout: 3000,
        });
        await myBot.sendMessage(id, `registrasi berhasil\nUsername: ${username}\nPassword: ${password}`);
    } catch (e) {
        await myBot.sendMessage(id, "error, silahkan mengulangi registrasi!");
    }
    await page.close()
};

export default {
    formatter,
    register,
    verify
}