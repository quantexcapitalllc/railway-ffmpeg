const express = require("express");
const multer = require("multer");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
const upload = multer({ dest: "uploads/" });

app.post(
  "/render",
  upload.fields([{ name: "clips" }, { name: "voice" }, { name: "subs" }]),
  (req, res) => {
    try {
      const clips = req.files["clips"].map((f) => f.path);
      const voice = req.files["voice"][0].path;
      const subs = req.files["subs"][0].path;
      const output = `output_${Date.now()}.mp4`;

      // Lista de clips para concat
      const listFile = `uploads/list_${Date.now()}.txt`;
      fs.writeFileSync(
        listFile,
        clips.map((c) => `file '${path.resolve(c)}'`).join("\n")
      );

      // Comando FFmpeg
      const cmd = `
        ffmpeg -y -f concat -safe 0 -i ${listFile} -i ${voice} \
        -vf "scale=1080:1920:force_original_aspect_ratio=decrease,
             eq=contrast=1.06:saturation=1.05,
             vignette=PI/6:0.2,
             noise=alls=6:allf=t+u,
             subtitles=${subs}:force_style='FontName=Inter,FontSize=48,OutlineColour=&H111111&,BorderStyle=3,BackColour=&H66000000&'" \
        -c:v libx264 -crf 20 -preset medium -c:a aac -shortest ${output}
      `;

      exec(cmd, (err) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Error en render");
        }
        res.download(output, () => {
          fs.unlinkSync(output);
          fs.unlinkSync(listFile);
          clips.forEach((c) => fs.unlinkSync(c));
          fs.unlinkSync(voice);
          fs.unlinkSync(subs);
        });
      });
    } catch (e) {
      console.error(e);
      res.status(500).send("Error inesperado");
    }
  }
);

app.get("/", (req, res) => res.send("FFmpeg microservice running ✅"));

app.listen(3000, () => console.log("FFmpeg service on port 3000"));
