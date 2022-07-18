export interface IUserStory {
    user_id: number,
    user_image: string,
    user_name: string,
    stories: IUserStoryItem[]
}

export interface IUserStoryItem {
    story_id: number,
    story_image: string,
    onPress?: any,
    swipeText?: string,
}

export interface IPageToUserId {
    user_id: number,
    story_id: number,
}
