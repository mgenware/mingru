package da

import (
	"github.com/mgenware/go-packagex/dbx"
)

// TableTypePostCmtRpl ...
type TableTypePostCmtRpl struct {
}

// PostCmtRpl ...
var PostCmtRpl = &TableTypePostCmtRpl{}

// ------------ Actions ------------

// InsertPostReply ...
func (da *TableTypePostCmtRpl) InsertPostReply(queryable dbx.Queryable, postCmtRplToUserID uint64, postCmtRplUserID uint64) (uint64, error) {
	result, err := queryable.Exec("INSERT INTO `post_cmt_rpl` (`to_user_id`, `user_id`) VALUES (?, ?)", postCmtRplToUserID, postCmtRplUserID)
	return dbx.GetLastInsertIDUint64WithError(result, err)
}
