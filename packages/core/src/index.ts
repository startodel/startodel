/** A learner's goals for studying software development. */
export interface Profile {
  id: string;
  goals: string[];
}

/** A concept or skill a learner can study. */
export interface Topic {
  id: string;
  title: string;
}

/** A directed link from a prerequisite Topic to the Topic that builds on it. */
export interface TopicEdge {
  prerequisiteId: Topic["id"];
  topicId: Topic["id"];
}

/** An ordered sequence of Topics chosen for a Profile. */
export interface Track {
  id: string;
  profileId: Profile["id"];
  topicIds: Topic["id"][];
}

/** A unit of study on a Topic within a Track. */
export interface Lesson {
  id: string;
  trackId: Track["id"];
  topicId: Topic["id"];
}

/** A set of questions that checks understanding of a Lesson. */
export interface Quiz {
  id: string;
  lessonId: Lesson["id"];
}

/** An interactive round of follow-up questions about a Lesson. */
export interface GrillSession {
  id: string;
  lessonId: Lesson["id"];
}

/** A Topic set aside for a learner to revisit. */
export interface ReviewItem {
  profileId: Profile["id"];
  topicId: Topic["id"];
}

/** A record of Lessons completed within a Track. */
export interface Progress {
  trackId: Track["id"];
  completedLessonIds: Lesson["id"][];
}
