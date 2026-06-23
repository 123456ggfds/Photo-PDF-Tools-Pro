import * as base64js from "base64-js";
import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from "react-native";

import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";

import { PDFDocument } from "pdf-lib";

export default function ImageToPDFScreen() {
  const [images, setImages] = useState<string[]>([]);

  const pickImages = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      type: "image/*",
    });

    if (!result.canceled) {
      const uris = result.assets.map((asset) => asset.uri);
      setImages(uris);
    }
  };

  const createPDF = async () => {
    try {
      if (images.length === 0) {
        Alert.alert("請先選擇圖片");
        return;
      }

      const pdfDoc = await PDFDocument.create();

      for (const imageUri of images) {
        const imageBytes = await FileSystem.readAsStringAsync(imageUri, {
          encoding: "base64" as any,
        });

        const imageUint8Array = base64js.toByteArray(imageBytes);

        let embeddedImage;

        if (imageUri.endsWith(".png")) {
          embeddedImage = await pdfDoc.embedPng(imageUint8Array);
        } else {
          embeddedImage = await pdfDoc.embedJpg(imageUint8Array);
        }

        const page = pdfDoc.addPage([
          embeddedImage.width,
          embeddedImage.height,
        ]);

        page.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: embeddedImage.width,
          height: embeddedImage.height,
        });
      }

      const pdfBytes = await pdfDoc.save();

      const pdfUri =
        (FileSystem.cacheDirectory ?? "") + "photo-pdf-tools-output.pdf";

      const base64Pdf = base64js.fromByteArray(pdfBytes);
      await FileSystem.writeAsStringAsync(pdfUri, base64Pdf, {
        encoding: "base64" as any,
      });

      await Sharing.shareAsync(pdfUri);

      Alert.alert("PDF 建立成功");
    } catch (error) {
      console.error(error);
      Alert.alert("PDF 建立失敗");
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#090B10",
        paddingTop: 60,
      }}
    >
      <Text
        style={{
          color: "white",
          fontSize: 32,
          fontWeight: "bold",
          paddingHorizontal: 20,
        }}
      >
        Image to PDF
      </Text>

      <TouchableOpacity
        onPress={pickImages}
        style={{
          margin: 20,
          backgroundColor: "#7C3AED",
          padding: 18,
          borderRadius: 20,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: "white",
            fontSize: 18,
            fontWeight: "600",
          }}
        >
          選擇圖片
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={createPDF}
        style={{
          marginHorizontal: 20,
          backgroundColor: "#1E293B",
          padding: 18,
          borderRadius: 20,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: "white",
            fontSize: 18,
            fontWeight: "600",
          }}
        >
          轉換 PDF
        </Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={{
          padding: 20,
        }}
      >
        {images.map((uri, index) => (
          <Image
            key={index}
            source={{ uri }}
            style={{
              width: "100%",
              height: 240,
              borderRadius: 20,
              marginBottom: 16,
            }}
            resizeMode="cover"
          />
        ))}
      </ScrollView>
    </View>
  );
}
