package da

import (
	"time"

	"github.com/mgenware/go-packagex/dbx"
)

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// InsertTimes ...
func (da *TableTypePost) InsertTimes(queryable dbx.Queryable, postDatetime time.Time, postNDatetime *time.Time) (uint64, error) {
	result, err := queryable.Exec("INSERT INTO `post` (`datetime`, `n_datetime`) VALUES (?, ?)", postDatetime, postNDatetime)
	return dbx.GetLastInsertIDUint64WithError(result, err)
}
