import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Image,
  FlatList,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import firestore from "@react-native-firebase/firestore";

const { width } = Dimensions.get("window");
const SLIDER_HEIGHT = width * 0.58;

const HomeSlider = ({ navigation }) => {
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection("sliders")
      .orderBy("createdAt", "desc")
      .limit(10)
      .onSnapshot(
        (snapshot) => {
          const list = snapshot.docs.map((doc) => ({
            id: doc.id,
            imageBase64: doc.data().imageBase64,
          }));
          setSliders(list);
          setLoading(false);
        },
        () => setLoading(false)
      );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (sliders.length < 2) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % sliders.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4500);
    return () => clearInterval(timer);
  }, [sliders.length]);

  const onScroll = (e) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    if (newIndex !== currentIndex) setCurrentIndex(newIndex);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#27ae60" />
      </View>
    );
  }

  if (sliders.length === 0) {
    return (
      <View style={styles.sliderWrapper}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate("Promotions")}
        >
          <Image
            source={{ uri: "https://img.freepik.com/free-vector/organic-farming-banner-template_23-2149372809.jpg?w=2000" }}
            style={styles.singleImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.sliderWrapper}>
      <FlatList
        ref={flatListRef}
        data={sliders}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <TouchableOpacity>
            <Image
              source={{ uri: item.imageBase64 }}
              style={styles.image}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
      />

      <View style={styles.pagination}>
        {sliders.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === currentIndex && styles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sliderWrapper: {
    marginTop: 12,
    marginBottom: 20,
    paddingHorizontal: 12,
    height: SLIDER_HEIGHT,
  },
  image: {
    width: width - 24,
    height: SLIDER_HEIGHT,
    borderRadius: 18,
    backgroundColor: "#f0f0f0",
  },
  singleImage: {
    width: width - 24,
    height: SLIDER_HEIGHT,
    borderRadius: 18,
  },
  loadingContainer: {
    height: SLIDER_HEIGHT,
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
  },
  pagination: {
    flexDirection: "row",
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.6)",
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: "#fff",
    width: 26,
    borderRadius: 6,
  },
});

export default HomeSlider;