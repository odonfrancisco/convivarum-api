import { Friend } from '#schema/index.js'

export default class FriendPicker {
  uncontacted
  current
  randomDoc

  constructor(user, action) {
    this.user = user
    this.action = action
  }

  async pickNewFriend(save = false) {
    ;[this.uncontacted, this.current] = await Promise.all([
      Friend.find({
        action: this.action,
        user: this.user._id,
        enabled: true,
        contacted: false,
      }),
      Friend.findOne({ action: this.action, user: this.user._id, current: true }),
    ])

    if (!this.uncontacted.length) {
      const contacted = await Friend.find({
        user: this.user._id,
        action: this.action,
        enabled: true,
        contacted: true,
        current: false,
      })

      if (!contacted.length) {
        // One friend in this action
        if (this.current) this.uncontacted.push(this.current)
        // No friends in this action
        else return {}
      } else if (contacted.length === 1) {
        this.uncontacted.push(contacted[0])
      } else {
        for (const doc of contacted) {
          // handle updating the 'contacted' prop to false on each friend doc
          doc.set({ contacted: false })
          this.uncontacted.push(doc)
        }
      }
    }
    const randomIndex = Math.floor(Math.random() * this.uncontacted.length)
    this.randomDoc = this.uncontacted[randomIndex]
    this.uncontacted.splice(randomIndex, 1)

    // When user first signs up, none of their friends will be current
    if (this.current && this.current._id !== this.randomDoc?._id) {
      // Would have to do something about lastContact, will probs be better once i switch to a historical approach using "interaction" docs
      this.current.set({
        current: false,
        contacted: false,
        interactions: --this.current.interactions,
      })
    }
    this.randomDoc.set({
      current: true,
      contacted: true,
      lastContacted: Date.now(),
      interactions: ++this.current.interactions,
    })

    if (save) await this.saveFriends()

    return { uncontacted: this.uncontacted, current: this.current, randomDoc: this.randomDoc }
  }

  async saveFriends() {
    await Promise.all([
      this.current && this.current._id !== this.randomDoc._id && this.current.save(),
      this.randomDoc.save(),
      ...this.uncontacted.map(d => d.save()),
    ])

    // Here, you can implement the logic to save/update the friends in the database or any other operation you want
  }
}
