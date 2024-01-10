import { wcf } from "./proto-generated/wcf";
import { ToPlainType } from "./utils";

export type RawMessage = ToPlainType<wcf.WxMsg>;

export class Message {
    constructor(private readonly message: wcf.WxMsg) {}

    get raw(): RawMessage {
        return this.message;
    }

    get id() {
        return this.message.id;
    }

    get type() {
        return this.message.type;
    }

    get isSelf() {
        return this.message.is_self;
    }

    isAt(wxid: string) {
        /*
          """是否被 @：群消息，在 @ 名单里，并且不是 @ 所有人"""
        if not self.from_group():
            return False  # 只有群消息才能 @

        if not re.findall(f"<atuserlist>.*({wxid}).*</atuserlist>", self.xml):
            return False  # 不在 @ 清单里

        if re.findall(r"@(?:所有人|all|All)", self.content):
            return False  # 排除 @ 所有人

        return True
        */
        if (!this.isGroup) {
            return false;
        }
        if (
            !new RegExp(`<atuserlist\\>.*(${wxid}).*</atuserlist>`).test(
                this.xml
            )
        ) {
            return false;
        }
        if (/@(?:所有人|all|All)/.test(this.message.content)) {
            return false;
        }

        return true;
    }

    get xml() {
        return this.message.xml;
    }

    get isGroup() {
        return this.message.is_group;
    }

    get roomId() {
        return this.message.roomid;
    }

    get content() {
        return this.message.content;
    }

    get sender() {
        return this.message.sender;
    }
}
