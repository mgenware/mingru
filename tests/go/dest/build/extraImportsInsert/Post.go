package da

import (
	"time"

	"github.com/mgenware/go-packagex/database/sqlx"
)

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// InsertTimes ...
func (da *TableTypePost) InsertTimes(queryable sqlx.Queryable, postDatetime time.Time, postNDatetime *time.Time) (uint64, error) {
	result, err := queryable.Exec("INSERT INTO `post` (`datetime`, `n_datetime`) VALUES (?, ?)", postDatetime, postNDatetime)
	return sqlx.GetLastInsertIDUint64WithError(result, err)
}
