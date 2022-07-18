import React, {Fragment, useRef, useState, useEffect} from "react";
import {Dimensions, View, Platform} from "react-native";
import Modal from "react-native-modalbox";
import StoryListItem from "./StoryListItem";
import StoryCircleListView from "./StoryCircleListView";
import {isNullOrWhitespace} from "./helpers/ValidationHelpers";
import type {IUserStory , IPageToUserId} from "./interfaces/IUserStory";
import AndroidCubeEffect from "./components/AndroidCubeEffect";
import CubeNavigationHorizontal from "./components/CubeNavigationHorizontal";
import {TextStyle} from "react-native";

type Props = {
    data: IUserStory[],
    style?: any,
    unPressedBorderColor?: string,
    pressedBorderColor?: string,
    onClose?: function,
    onStart?: function,
    duration?: number,
    swipeText?: string,
    customSwipeUpComponent?: any,
    customCloseComponent?: any,
    avatarSize?: number,
    showAvatarText?: boolean,
    avatarTextStyle?: TextStyle,
    setOpenPageToUserId?: IPageToUserId,
};
const getUserByUserId = (user_id,data) => data.find(u=>u.user_id == user_id)
const getUserIndexByUserId = (user_id,data) => data.findIndex(u=>u.user_id == user_id)
const getPageIndexByUserId = (story_id, stories) => stories.findIndex(u=>u.story_id === story_id)
const isValidPageToUserId = ({user_id, story_id}, data) => {
    const user = getUserByUserId(user_id, data)
    if (!user) {
        return false
    }
    const story = user.stories.find(u=>u.story_id === story_id)
    if (!story) {
        return false
    }
    return true
}

const defaultCurrentPage = 0
const getPageIndexFromSetOpen = ({user_id, story_id}, data) => {
    try {
        const user = getUserByUserId(user_id, data)
        return getPageIndexByUserId(story_id, user.stories)    
    } catch (e) {

    }
    return defaultCurrentPage
}

export const Story = (props: Props) => {
    const {
        data,
        unPressedBorderColor,
        pressedBorderColor,
        style,
        onStart,
        onClose,
        duration,
        swipeText,
        customSwipeUpComponent,
        customCloseComponent,
        avatarSize,
        showAvatarText,
        avatarTextStyle,
        setOpenPageToUserId,
    } = props;

    const [dataState, setDataState] = useState(data);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(defaultCurrentPage);
    const [selectedData, setSelectedData] = useState([]);
    const cube = useRef();

    // Component Functions
    const _handleStoryItemPress = (item, index) => {
        const newData = dataState.slice(index);
        if (onStart) {
            onStart(item)
        }
        setCurrentPage(0);
        setSelectedData(newData);
        setIsModalOpen(true);
    };
    const handleGoToUsersStory = (userIndex, pageIndex) => {
        const newData = dataState.slice(userIndex);
        setSelectedData(newData);
        setCurrentPage(pageIndex);
        // let tempData = newData;
        // dataState[pageIndex] = {
        //     ...dataState[pageIndex],
        //     seen: true
        // }
        // setDataState(tempData);
        setIsModalOpen(true);
    };

    useEffect(() => {
        if (setOpenPageToUserId && isValidPageToUserId(setOpenPageToUserId, data)) {
            const userIndex = getUserIndexByUserId(setOpenPageToUserId.user_id, data)
            const pageIndex = getPageIndexFromSetOpen(setOpenPageToUserId, data)
            handleGoToUsersStory(userIndex, pageIndex)
        }
        
    }, [setOpenPageToUserId]);

    useEffect(() => {
        handleSeen();
    }, [currentPage]);

    const handleSeen = () => {
        const seen = selectedData[currentPage];
        const seenIndex = dataState.indexOf(seen);
        if (seenIndex > 0) {
            if (!dataState[seenIndex]?.seen) {
                let tempData = dataState;
                dataState[seenIndex] = {
                    ...dataState[seenIndex],
                    seen: true
                }
                setDataState(tempData);
            }
        }
    }

    function onStoryFinish(state) {
        if (!isNullOrWhitespace(state)) {
            if (state == "next") {
                const newPage = currentPage + 1;
                if (newPage < selectedData.length) {
                    setCurrentPage(newPage);
                    cube?.current?.scrollTo(newPage);
                } else {
                    setIsModalOpen(false);
                    setCurrentPage(0);
                    if (onClose) {
                        onClose(selectedData[selectedData.length - 1]);
                    }
                }
            } else if (state == "previous") {
                const newPage = currentPage - 1;
                if (newPage < 0) {
                    setIsModalOpen(false);
                    setCurrentPage(0);
                } else {
                    setCurrentPage(newPage);
                    cube?.current?.scrollTo(newPage);
                }
            }
        }
    }

    const renderStoryList = () => selectedData.map((x, i) => {
        return (<StoryListItem duration={duration * 1000}
                               key={i}
                               profileName={x.user_name}
                               profileImage={x.user_image}
                               stories={x.stories}
                               gotoPage={x.user_id === setOpenPageToUserId.user_id && getPageIndexFromSetOpen(setOpenPageToUserId, data)}
                               currentPage={currentPage}
                               onFinish={onStoryFinish}
                               swipeText={swipeText}
                               customSwipeUpComponent={customSwipeUpComponent}
                               customCloseComponent={customCloseComponent}
                               onClosePress={() => {
                                   setIsModalOpen(false);
                                   if (onClose) {
                                       onClose(x);
                                   }
                               }}
                               index={i}/>)
    })

    const renderCube = () => {
        if (Platform.OS == 'ios') {
            return (
                <CubeNavigationHorizontal
                    ref={cube}
                    callBackAfterSwipe={(x) => {
                        if (x != currentPage) {
                            setCurrentPage(parseInt(x));
                        }
                    }}
                >
                    {renderStoryList()}
                </CubeNavigationHorizontal>
            )
        } else {
            return (<AndroidCubeEffect
                ref={cube}
                callBackAfterSwipe={(x) => {
                    if (x != currentPage) {
                        setCurrentPage(parseInt(x));
                    }
                }}
            >
                {renderStoryList()}
            </AndroidCubeEffect>)
        }
    }

    return (
        <Fragment>
            <View style={style}>
                <StoryCircleListView
                    handleStoryItemPress={_handleStoryItemPress}
                    data={dataState}
                    avatarSize={avatarSize}
                    unPressedBorderColor={unPressedBorderColor}
                    pressedBorderColor={pressedBorderColor}
                    showText={showAvatarText}
                    textStyle={avatarTextStyle}
                />
            </View>
            <Modal
                style={{
                    flex: 1,
                    height: Dimensions.get("window").height,
                    width: Dimensions.get("window").width
                }}
                isOpen={isModalOpen}
                onClosed={() => setIsModalOpen(false)}
                position="center"
                swipeToClose
                swipeArea={250}
                backButtonClose
                coverScreen={true}
            >
                {renderCube()}
            </Modal>
        </Fragment>
    );
};
export default Story;

Story.defaultProps = {
    showAvatarText: true
}
