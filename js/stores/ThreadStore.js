/**
 * threadStore file is provided by Facebook for testing and evaluation purposes
 * only. Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { Store } from 'thundercats';
import assign from 'object-assign';
import ChatMessageUtils from '../utils/ChatMessageUtils';

const initValue = {
  threads: {},
  currentID: null
};

export default Store()
  .refs({
    displayName: 'ThreadStore',
    value: initValue
  })
  .init(({ instance: threadStore, args: [cat] }) => {
    const chatActions = cat.getActions('chatActions');
    const {
      clickThread,
      receiveRawMessages
    } = chatActions;

    threadStore.register(clickThread.map(threadID => ({
      transform: ({ threads })=> {
        const newThreads = Object.keys(threads).reduce((result, id) => {
          const thread = threads[id];
          if (threadID === id) {
            const lastMessage = assign(
              {},
              thread.lastMessage,
              { isRead: true }
            );
            result[id] = assign({}, thread, { lastMessage });
          } else {
            result[id] = thread;
          }
          return result;
        }, {});

        return {
          threads: newThreads,
          currentID: threadID
        };
      }
    })));

    threadStore.register(receiveRawMessages.map(rawMessages => ({
      transform: ({ threads, currentID }) => {
        const newThreads = assign({}, threads);

        rawMessages.forEach(message => {
          const threadID = message.threadID;
          const thread = newThreads[threadID];
          if (thread && thread.lastTimestamp > message.timestamp) {
            return;
          }
          newThreads[threadID] = {
            id: threadID,
            name: message.threadName,
            lastMessage: ChatMessageUtils.convertRawMessage(message, currentID)
          };
        });

        if (!currentID) {
          const allChrono = ChatMessageUtils.getAllChrono(newThreads);
          currentID = allChrono[allChrono.length - 1].id;
        }

        newThreads[currentID].lastMessage.isRead = true;

        return {
          currentID,
          threads: newThreads
        };
      }
    })));

    return threadStore;
  });
