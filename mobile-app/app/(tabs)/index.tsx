import { router } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from "react-native";

const tools = [
  {
    title: "Image to PDF",
    route: "/image-to-pdf",
  },
  {
    title: "Merge Images",
    route: "/merge-images",
  },
  {
    title: "Compress Image",
    route: "/compress",
  },
];

export default function HomeScreen() {
  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#090B10",
      }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: 60,
          paddingHorizontal: 20,
          paddingBottom: 40,
        }}
      >
        <Text
          style={{
            color: "white",
            fontSize: isTablet ? 42 : 32,
            fontWeight: "bold",
          }}
        >
          Photo PDF Tools Pro
        </Text>

        <Text
          style={{
            color: "#94A3B8",
            marginTop: 10,
            marginBottom: 30,
            fontSize: 16,
          }}
        >
          Modern photo & PDF utility app
        </Text>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          {tools.map((tool, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => router.push(tool.route as any)}
              style={{
                width: isTablet ? "48%" : "100%",
                backgroundColor: "#111827",
                borderRadius: 24,
                padding: 24,
                marginBottom: 18,
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 24,
                  fontWeight: "600",
                }}
              >
                {tool.title}
              </Text>

              <Text
                style={{
                  color: "#94A3B8",
                  marginTop: 10,
                }}
              >
                Open Tool
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
