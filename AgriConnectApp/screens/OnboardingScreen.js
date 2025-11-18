import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const OnboardingScreen = ({ navigation }) => {
  const [step, setStep] = useState(0);

  const data = [
    {
      title: 'Nông Sản Tươi Sạch Từ Vườn',
      desc: 'Kết nối trực tiếp với nông dân,\nđảm bảo nguồn gốc rõ ràng,\nrau củ, trái cây tươi ngon mỗi ngày.',
      image: require('../assets/anh1.png'),
    },
    {
      title: 'Hỗ Trợ Nông Dân Bán Hàng',
      desc: 'Giúp bà con nông dân bán sản phẩm dễ dàng,\ngiá tốt, không qua trung gian,\ntăng thu nhập bền vững.',
      image: require('../assets/anh2.png'),
    },
    {
      title: 'Mua Sắm Dễ Dàng',
      desc: 'Chọn sản phẩm, đặt hàng nhanh chóng. \nBắt đầu ngay hôm nay!',
      image: require('../assets/anh3.png'),
    },
  ];

  const nextStep = () => {
    if (step < data.length - 1) {
      setStep(step + 1);
    }
  };

  const skip = () => navigation.replace('AuthFlow');
  const goToLogin = () => navigation.replace('AuthFlow');

  return (
    <ImageBackground source={data[step].image} style={styles.background}>
      <View style={styles.overlay}>
        <Text style={styles.title}>{data[step].title}</Text>
        <Text style={styles.desc}>{data[step].desc}</Text>
        <View style={styles.dots}>
          {data.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, step === i && { backgroundColor: '#4A44F2', width: 12 }]}
            />
          ))}
        </View>
        <View style={styles.buttons}>
          <TouchableOpacity onPress={skip}>
            <Text style={styles.skip}>Skip</Text>
          </TouchableOpacity>
          {step < data.length - 1 ? (
            <TouchableOpacity onPress={nextStep}>
              <Text style={styles.next}>Next</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 60 }} />
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.letsGoBtn} onPress={goToLogin}>
        <Text style={styles.letsGoText}>Bắt đầu</Text>
      </TouchableOpacity>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, width, height },
  overlay: {
    position: 'absolute',
    bottom: 130,
    alignSelf: 'center',
    width: width * 0.85,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#1A5D1A',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 30,
  },
  desc: {
    fontSize: 15,
    color: '#2D6A2D',
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 20,
    fontWeight: '500',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#B2D8B2',
    marginHorizontal: 4,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  skip: {
    color: '#6B9E6B',
    fontSize: 15,
    fontWeight: '600',
  },
  next: {
    color: '#1A5D1A',
    fontWeight: 'bold',
    fontSize: 16,
  },
  letsGoBtn: {
    position: 'absolute',
    bottom: 50,
    width: width * 0.85,
    alignSelf: 'center',
    backgroundColor: '#1A5D1A',
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
  letsGoText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 17,
  },
});

export default OnboardingScreen;