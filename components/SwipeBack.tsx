import React, { useRef } from 'react';
import { Animated, PanResponder, Dimensions, StyleSheet, View } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;  // 30% de l'écran suffit
const EDGE_WIDTH = SCREEN_WIDTH * 0.25;       // 25% gauche de l'écran (Instagram-like)

type Props = {
  onSwipeBack: () => void;
  children: React.ReactNode;
};

export default function SwipeBack({ onSwipeBack, children }: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isActive = useRef(false);

  const overlayOpacity = translateX.interpolate({
    inputRange: [0, SCREEN_WIDTH],
    outputRange: [0.12, 0],
    extrapolate: 'clamp',
  });

  const shadowOpacity = translateX.interpolate({
    inputRange: [0, SCREEN_WIDTH * 0.1, SCREEN_WIDTH],
    outputRange: [0, 0.12, 0],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,

      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const touchX = evt.nativeEvent.pageX;
        const isFromZone = touchX <= EDGE_WIDTH;          // zone large
        const isRightward = gestureState.dx > 5;          // seuil bas
        const isMoreHorizThanVert = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 0.5; // tolérant
        return isFromZone && isRightward && isMoreHorizThanVert;
      },

      onMoveShouldSetPanResponderCapture: () => false,

      onPanResponderGrant: () => {
        isActive.current = true;
        translateX.setValue(0);
      },

      onPanResponderMove: (_, gestureState) => {
        if (!isActive.current) return;
        if (gestureState.dx > 0) {
          translateX.setValue(gestureState.dx);
        }
      },

      onPanResponderRelease: (_, gestureState) => {
        if (!isActive.current) return;
        isActive.current = false;
        const velocity = gestureState.vx;

        if (gestureState.dx > SWIPE_THRESHOLD || velocity > 0.5) {
          Animated.timing(translateX, {
            toValue: SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateX.setValue(0);
            onSwipeBack();
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 3,
            speed: 16,
          }).start();
        }
      },

      onPanResponderTerminate: () => {
        isActive.current = false;
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
          speed: 20,
        }).start();
      },
    })
  ).current;

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} pointerEvents="none" />
      <Animated.View
        style={[styles.container, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <Animated.View style={[styles.leftShadow, { opacity: shadowOpacity }]} pointerEvents="none" />
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 0,
  },
  container: {
    backgroundColor: 'transparent',
    flex: 1,
    zIndex: 1,
  },
  leftShadow: {
    position: 'absolute',
    top: 0, bottom: 0, left: -20, width: 20,
    zIndex: 10,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: -8, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 10,
  },
});