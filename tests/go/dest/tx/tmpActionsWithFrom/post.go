package da

import (
	"database/sql"
	"time"

	"github.com/mgenware/mingru-go-lib"
)

type PostAGType struct {
}

var PostAG = &PostAGType{}

// ------------ Actions ------------

func (mrTable *PostAGType) tChild1(mrQueryable mingru.Queryable, content string, userID uint64, createdAt time.Time, modifiedAt time.Time, rplCount uint) (uint64, error) {
	result, err := mrQueryable.Exec("INSERT INTO `cmt` (`content`, `user_id`, `created_at`, `modified_at`, `rpl_count`) VALUES (?, ?, ?, ?, ?)", content, userID, createdAt, modifiedAt, rplCount)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}

func (mrTable *PostAGType) tChild2(mrQueryable mingru.Queryable, postID uint64, cmtID uint64) error {
	_, err := mrQueryable.Exec("INSERT INTO `post_cmt` (`post_id`, `cmt_id`) VALUES (?, ?)", postID, cmtID)
	return err
}

func (mrTable *PostAGType) T(db *sql.DB, content string, userID uint64, createdAt time.Time, modifiedAt time.Time, rplCount uint, postID uint64, cmtID uint64) error {
	txErr := mingru.Transact(db, func(tx *sql.Tx) error {
		var err error
		_, err = mrTable.tChild1(tx, content, userID, createdAt, modifiedAt, rplCount)
		if err != nil {
			return err
		}
		err = mrTable.tChild2(tx, postID, cmtID)
		if err != nil {
			return err
		}
		return nil
	})
	return txErr
}
